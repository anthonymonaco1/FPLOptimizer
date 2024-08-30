from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from pulp import LpMaximize, LpProblem, LpVariable, lpSum
import logging
import asyncio
import aiohttp

load_dotenv('.env')

key = os.getenv("SUPABASE_ANON_KEY")
url = os.getenv("SUPABASE_URL")

supabase: Client = create_client(url, key)
app = FastAPI()
# Add CORS middleware to allow specific origins (or use "*" for all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # List of allowed methods
    allow_headers=["*"],  # List of allowed headers
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def calculate_expected_points(player, fixture_difficulty):
    # Extract relevant data
    minutes = player.get('minutes', 0)
    expected_goals = float(player.get('expected_goals', 0))
    expected_assists = float(player.get('expected_assists', 0))
    clean_sheets_per_90 = player.get('clean_sheets_per_90', 0)
    expected_goals_conceded_per_90 = float(player.get('expected_goals_conceded_per_90', 0))
    bonus = int(player.get('bonus', 0))
    yellow_cards = int(player.get('yellow_cards', 0))
    red_cards = int(player.get('red_cards', 0))
    games_played = player.get('starts', 0)
    saves_per_90 = float(player.get('saves_per_90', 0))
    element_type = player.get('element_type', 0)

    # Calculate expected values
    if games_played > 0:
        expected_bonus_per_game = bonus / games_played
        expected_yellow_cards_per_game = yellow_cards / games_played
        expected_red_cards_per_game = red_cards / games_played
    else:
        expected_bonus_per_game = 0
        expected_yellow_cards_per_game = 0
        expected_red_cards_per_game = 0

    # Calculate expected points based on player position
    if element_type == 1:  # Goalkeeper
        expected_points = (
            (minutes / 90) * 2 +
            expected_goals * 10 +
            expected_assists * 3 +
            clean_sheets_per_90 * 4 -
            (expected_goals_conceded_per_90 / 2) * 1 +
            expected_bonus_per_game -
            expected_yellow_cards_per_game * 1 -
            expected_red_cards_per_game * 3 +
            saves_per_90 / 3 * 1
        )
    elif element_type == 2:  # Defender
        expected_points = (
            (minutes / 90) * 2 +
            expected_goals * 6 +
            expected_assists * 3 +
            clean_sheets_per_90 * 4 -
            (expected_goals_conceded_per_90 / 2) * 1 +
            expected_bonus_per_game -
            expected_yellow_cards_per_game * 1 -
            expected_red_cards_per_game * 3
        )
    elif element_type == 3:  # Midfielder
        expected_points = (
            (minutes / 90) * 2 +
            expected_goals * 5 +
            expected_assists * 3 +
            clean_sheets_per_90 * 1 +
            expected_bonus_per_game -
            expected_yellow_cards_per_game * 1 -
            expected_red_cards_per_game * 3
        )
    elif element_type == 4:  # Forward
        expected_points = (
            (minutes / 90) * 2 +
            expected_goals * 4 +
            expected_assists * 3 +
            expected_bonus_per_game -
            expected_yellow_cards_per_game * 1 -
            expected_red_cards_per_game * 3
        )
    else:
        expected_points = 0

    # Adjust for fixture difficulty
    final_expected_points = expected_points * (2.0 / fixture_difficulty)

    return final_expected_points

def fetch_fixture_difficulty(player_id):
    url = f"https://fantasy.premierleague.com/api/element-summary/{player_id}/"
    logger.info(f"Fetching fixture difficulty for player {player_id}")
    response = requests.get(url)
    fixtures = response.json().get('fixtures', [])
    if fixtures:
        difficulty = fixtures[0].get('difficulty', 3)
        logger.info(f"Fixture difficulty for player {player_id}: {difficulty}")
        return difficulty
    logger.info(f"No fixture data found for player {player_id}. Defaulting to difficulty 3")
    return 3

# async def fetch_fixture_difficulty_async(session, player_id):
#     url = f"https://fantasy.premierleague.com/api/element-summary/{player_id}/"
#     async with session.get(url) as response:
#         fixtures = await response.json()
#         fixtures = fixtures.get('fixtures', [])
#         if fixtures:
#             difficulty = fixtures[0].get('difficulty', 3)
#             return difficulty
#         return 3

def calculate_points_for_all_players(players):
    results = []
    logger.info(f"Calculating expected points for {len(players)} players...")
    for player in players:
        player_id = player['id']
        fixture_difficulty = fetch_fixture_difficulty(player_id)
        expected_points = calculate_expected_points(player, fixture_difficulty)
        logger.info(f"Player {player['first_name']} {player['second_name']}: Expected Points = {expected_points}, Fixture Difficulty = {fixture_difficulty}")
        results.append({
            'player_id': player_id,
            'player_name': f"{player['first_name']} {player['second_name']}",
            'element_type': player['element_type'],
            'expected_points': expected_points,
            'fixture_difficulty': fixture_difficulty,
            'team': player['team'],
            'now_cost': float(player['now_cost']) / 10
        })
    logger.info("Finished calculating expected points.")
    return results


# async def calculate_points_for_all_players_async(players):
#     results = []
#     logger.info(f"Calculating expected points for {len(players)} players...")
#     async with aiohttp.ClientSession() as session:
#         tasks = []
#         for player in players:
#             player_id = player['id']
#             tasks.append(fetch_fixture_difficulty_async(session, player_id))
        
#         fixture_difficulties = await asyncio.gather(*tasks)
        
#         for idx, player in enumerate(players):
#             fixture_difficulty = fixture_difficulties[idx]
#             expected_points = calculate_expected_points(player, fixture_difficulty)
#             logger.info(f"Player {player['first_name']} {player['second_name']}: Expected Points = {expected_points}, Fixture Difficulty = {fixture_difficulty}")
#             results.append({
#                 'player_id': player['id'],
#                 'player_name': f"{player['first_name']} {player['second_name']}",
#                 'element_type': player['element_type'],
#                 'expected_points': expected_points,
#                 'fixture_difficulty': fixture_difficulty,
#                 'team': player['team'],
#                 'now_cost': float(player['now_cost']) / 10
#             })
#     logger.info("Finished calculating expected points.")
#     return results

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

@app.get("/optimize/{teamid}/{freetransfers}")
def read_root(teamid: str, freetransfers: int):
    logger.info("Starting the FPL optimization process...")

    try:
        # Fetch current team data
        team_data = get_current_team_data(teamid, freetransfers, 2)
        if not team_data:
            return {"error": "Failed to fetch team data"}
        
        # current = team_data['current_team']
        # free = 15
        # bank = 0
        # value = 1000
        
        current = team_data['current_team']
        free = team_data['free_transfers']
        bank = team_data['bank']
        value = team_data['total_value']

        # Calculate player expected points
        # logger.info("Fetching player data and calculating expected points...")
        # response = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/")
        # data = response.json()
        # players = data['elements']
        # new_players = calculate_points_for_all_players(players)

        # Fetch player data from Supabase instead of the FPL API
        logger.info("Fetching player data from Supabase...")
        response = supabase.table("players").select("*").execute()
        # if response.error:
        #     raise Exception(response.error.message)
        players = response.data
        logger.info(f"Total players fetched from Supabase: {len(players)}")

        # Optimize the team
        logger.info("Optimizing the team...")
        optimization_result = optimize_fpl_team(players, current, free, value, bank)

        logger.info(f"Optimization complete. Expected total points: {optimization_result.get('expected_total_points', 'N/A')}")
        return optimization_result

    except Exception as e:
        logger.error(f"Error in FPL optimization process: {e}")
        return {"error": str(e)}


def calculate_points_for_all_players_supabase(players):
    results = []
    logger.info(f"Calculating expected points for {len(players)} players...")
    for player in players:
        player_id = player['id']
        fixture_difficulty = fetch_fixture_difficulty(player_id)
        expected_points = calculate_expected_points(player, fixture_difficulty)
        logger.info(f"Player {player['first_name']} {player['second_name']}: Expected Points = {expected_points}, Fixture Difficulty = {fixture_difficulty}")
        
        player_data = {
            'player_id': player['id'],
            'player_name': f"{player['first_name']} {player['second_name']}",
            'element_type': player['element_type'],
            'expected_points': expected_points,
            'fixture_difficulty': fixture_difficulty,
            'team': player['team'],
            'now_cost': float(player['now_cost']) / 10
        }
        
        results.append(player_data)
    
    response = supabase.table("players").upsert(results).execute()
    if response.error:
        raise Exception(response.error.message)
    else:
        print("No. of players upserted: ", len(response.data))
    

@app.get("/insert_player_data")
def insert_player_data():
    try:
        # Fetch player data from the FPL API
        logger.info("Fetching player data...")
        response = requests.get("https://fantasy.premierleague.com/api/bootstrap-static/")
        data = response.json()
        players = data['elements']

        # Calculate expected points and insert data into Supabase
        logger.info("Calculating points and inserting data into Supabase...")
        calculate_points_for_all_players_supabase(players)

        return {"status": "success", "message": "Player data inserted successfully"}

    except Exception as e:
        logger.error(f"Error in inserting player data: {e}")
        return {"status": "error", "message": str(e)}
