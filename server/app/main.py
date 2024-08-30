from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from supabase import create_client, Client
import os
from pulp import LpMaximize, LpProblem, LpVariable, lpSum
import logging
import asyncio
import aiohttp
import traceback

## These keys allow read access to supabase to get player data
## I will update player data at the beginning of every new game week
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c3R1amJtd2Vmc25kZG5jYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3ODgxMDEsImV4cCI6MjA0MDM2NDEwMX0.A4-m-2R0LcX264NUQc64B7FAtfCFNggorGfLq6xeV_k'
SUPABASE_URL = 'https://hvstujbmwefsnddncava.supabase.co'


# Initialize supabase client and fastapi app
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Fetches current team data for given id, and gameweek
# free_transfers is passed through for the optimization process later
def get_current_team_data(team_id, free_transfers, gameweek):
    url = f"https://fantasy.premierleague.com/api/entry/{team_id}/event/{gameweek}/picks/"
    logger.info(f"Fetching current team data for team {team_id} in gameweek {gameweek}...")
    try:
        response = requests.get(url)
        data = response.json()
        logger.info("Current team data fetched successfully.")
    except Exception as e:
        logger.error(f"Error getting current team data: {e}")
        return None

    team = data["picks"]
    current_team_ids = [player["element"] for player in team]
    hist = data["entry_history"]
    logger.info(f"Current team player IDs: {current_team_ids}")
    logger.info(f"Free transfers: {free_transfers}, Bank: {hist['bank']}, Total Value: {hist['value']}")
    return {
        'current_team': current_team_ids,
        'free_transfers': free_transfers,
        'bank': hist['bank'],
        'total_value': hist['value']
    }


# Calculates optimal XV given a current XV, no. of free transfers, and budget = total_value + bank
def optimize_fpl_team(players, current_team_ids, free_transfers, total_value, bank):
    try:
        # Calculate the available budget for the new team
        budget = (total_value + bank) / 10
        logger.info(f"Starting optimization with a budget of {budget} and {free_transfers} free transfers...")

        # Initialize the problem
        problem = LpProblem("FPL_Team_Optimization", LpMaximize)

        # Decision variables: binary variable for each player indicating whether they are selected (1) or not (0)
        player_vars = {player['player_id']: LpVariable(f"player_{player['player_id']}", cat="Binary") for player in players}

        # Calculate total expected points for the starting 11
        total_expected_points = lpSum([player_vars[player['player_id']] * player['expected_points'] for player in players])

        # Calculate total team value
        total_team_value = lpSum([player_vars[player['player_id']] * player['now_cost'] for player in players])

        # Transfer costs: Count number of players in the final team not in the starting team
        transfers_made = lpSum([player_vars[player['player_id']] for player in players if player['player_id'] not in current_team_ids])

        # Total transfer cost (penalizing for exceeding free transfers)
        transfer_penalty = LpVariable("transfer_penalty", lowBound=0, cat="Integer")
        problem += transfer_penalty == (transfers_made - free_transfers)

        # Objective function: Maximize total expected points minus transfer cost
        problem += total_expected_points - 4 * transfer_penalty

        # Constraints:
        # 1. Formation Constraints for 15 players in total
        problem += lpSum([player_vars[player['player_id']] for player in players if player['element_type'] == 1]) == 2  # 2 GKs
        problem += lpSum([player_vars[player['player_id']] for player in players if player['element_type'] == 2]) == 5  # 5 DEFs
        problem += lpSum([player_vars[player['player_id']] for player in players if player['element_type'] == 3]) == 5  # 5 MIDs
        problem += lpSum([player_vars[player['player_id']] for player in players if player['element_type'] == 4]) == 3  # 3 FWDs

        # 2. Ensure exactly 15 players are selected
        problem += lpSum([player_vars[player['player_id']] for player in players]) == 15

        # 3. Budget Constraint
        problem += total_team_value <= budget

        # 4. Team Constraints (max 3 players per team)
        for team_id in set(player['team'] for player in players):
            problem += lpSum([player_vars[player['player_id']] for player in players if player['team'] == team_id]) <= 3

        # Solve the problem
        logger.info("Solving the optimization problem...")
        problem.solve()
        logger.info("Optimization complete.")

        # Extract the selected team
        selected_team = [player for player in players if player_vars[player['player_id']].value() == 1]

        # Sort the selected team by expected points in descending order
        selected_team = sorted(selected_team, key=lambda x: x['expected_points'], reverse=True)

        def add_player_to_team(player, team, counters, max_limits):
            """Helper function to add a player to the team if the position limit is not exceeded."""
            position = player['element_type']
            position_key = {
                1: 'gk',
                2: 'def',
                3: 'mid',
                4: 'fwd'
            }
            
            # Get the current count and max limit for the player's position
            pos_key = position_key[position]
            if counters[pos_key] < max_limits[pos_key]:
                team.append(player)
                counters[pos_key] += 1
            return team, counters

        # Initialize the final starting 11 and counters for positions
        starting_11 = []
        counters = {'gk': 0, 'def': 0, 'mid': 0, 'fwd': 0}
        min_limits = {'gk': 1, 'def': 3, 'mid': 2, 'fwd': 1}
        max_limits = {'gk': 1, 'def': 5, 'mid': 5, 'fwd': 3}

        # First, ensure minimum position requirements are met
        for player in selected_team:
            if len(starting_11) < sum(min_limits.values()):
                starting_11, counters = add_player_to_team(player, starting_11, counters, min_limits)

        # Now fill the remaining spots up to 11 players, respecting maximum limits
        for player in selected_team:
            if len(starting_11) == 11:
                break  # Stop once we have 11 players
            if player in starting_11:
                continue  # Skip players already selected
            starting_11, counters = add_player_to_team(player, starting_11, counters, max_limits)

        # Final check to ensure we have exactly 11 players and meet all constraints
        if len(starting_11) == 11 and all(counters[pos] >= min_limits[pos] for pos in counters):
            logger.info(f"Selected starting 11: {[player['player_name'] for player in starting_11]}")
            logger.info(f"Total expected points: {sum(player['expected_points'] for player in starting_11)}")
        else:
            logger.error("Error: Could not form a valid starting 11.")

        total_selected_value = sum(player['now_cost'] for player in selected_team)
        logger.info(f"Selected team value: {total_selected_value}")
        logger.info(f"Selected team: {[player['player_name'] for player in selected_team]}")

        # Construct output arrays:
        original_team = [
            {
                'name': player['player_name'],
                'team': player['team'],
                'position': player['element_type'],
                'cost': player['now_cost'],
                'expected_points': player['expected_points']
            }
            for player in players if player['player_id'] in current_team_ids
        ]

        optimized_team = [
             {
                'name': player['player_name'],
                'team': player['team'],
                'position': player['element_type'],
                'cost': player['now_cost'],
                'expected_points': player['expected_points']
            }
            for player in selected_team
        ]

        starting_XI = [
            {
                'name': player['player_name'],
                'team': player['team'],
                'position': player['element_type'],
                'cost': player['now_cost'],
                'expected_points': player['expected_points']
            }
            for player in starting_11 
        ]

        return {
            'original_team': original_team,
            'selected_team': optimized_team,
            'starting_11': starting_XI,
            'expected_total_points': problem.objective.value()
        }

    except Exception as e:
        logger.error(f"Error during optimization: {e}")
        return {"error": str(e)}


# API route called in the client that generates an optimal XV for the user based on their data
@app.get("/optimize/{teamid}/{freetransfers}/{gameweek}")
def read_root(teamid: str, freetransfers: int, gameweek: int):
    logger.info("Starting the FPL optimization process...")

    try:
        # Fetch current team data
        team_data = get_current_team_data(teamid, freetransfers, gameweek-1)
        if not team_data:
            return {"error": "Failed to fetch team data"}
        
        current = team_data['current_team']
        free = team_data['free_transfers']
        bank = team_data['bank']
        value = team_data['total_value']

        # Fetch player data from Supabase instead of the FPL API
        logger.info("Fetching player data from Supabase...")
        response = supabase.table("players").select("*").execute()
        players = response.data
        logger.info(f"Total players fetched from Supabase: {len(players)}")

        # Optimize the team
        logger.info("Optimizing the team...")
        optimization_result = optimize_fpl_team(players, current, free, value, bank)

        logger.info(f"Optimization complete. Expected total points: {optimization_result.get('expected_total_points', 'N/A')}")
        return optimization_result

    except Exception as e:
        logger.error(f"Error in FPL optimization process: {type(e).__name__}, {e}")
        logger.error(traceback.format_exc())
        return {"error": f"{type(e).__name__}: {str(e)}"}


