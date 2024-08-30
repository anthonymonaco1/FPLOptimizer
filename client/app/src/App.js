// Manually import SVGs
import arsenal from "./crests/arsenal.svg";
import astonVilla from "./crests/aston_villa.svg";
import bournemouth from "./crests/bournemouth.svg";
import brentford from "./crests/brentford.svg";
import brighton from "./crests/brighton.svg";
import chelsea from "./crests/chelsea.svg";
import crystalPalace from "./crests/crystal_palace.svg";
import everton from "./crests/everton.svg";
import fulham from "./crests/fulham.svg";
import ipswich from "./crests/ipswich.svg";
import leicester from "./crests/leicester.svg";
import liverpool from "./crests/liverpool.svg";
import manCity from "./crests/man_city.svg";
import manUtd from "./crests/man_utd.svg";
import newcastle from "./crests/newcastle.svg";
import nottmForest from "./crests/nottm_forest.svg";
import southampton from "./crests/southampton.svg";
import spurs from "./crests/spurs.svg";
import westHam from "./crests/west_ham.svg";
import wolves from "./crests/wolves.svg";
import { useState, useEffect } from "react";
import axios from "axios";
import { RotatingLines } from "react-loader-spinner";
// import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [teamId, setTeamId] = useState("");
  const [freeTransfers, setFreeTransfers] = useState(0);
  const [originalXV, setOriginalXV] = useState([]);
  const [optimizedXV, setOPtimizedXV] = useState([]);
  const [startingXI, setStartingXI] = useState([]);
  const [expectedPoints, setExpectedPoints] = useState(0);
  const [playersIn, setPlayersIn] = useState([]);
  const [playersOut, setPlayersOut] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let id = teamId;
    let transfers = freeTransfers;

    // setTeamId("");
    // setFreeTransfers(0);
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:8000/optimize/${id}/${transfers}`
      );

      const result = response.data;
      const originalTeam = result["original_team"];
      const optimizedTeam = result["selected_team"];
      const startingTeam = result["starting_11"];
      const points = result["expected_total_points"];

      setOriginalXV(originalTeam);
      setOPtimizedXV(optimizedTeam);
      setStartingXI(startingTeam);
      setExpectedPoints(Math.round(points));

      console.log("Before findPlayersNotInOptimized");
      console.log("Original XV:", originalTeam);
      console.log("Optimized XV:", optimizedTeam);

      const playersNotInOptimized = findPlayersNotInOptimized(
        originalTeam,
        optimizedTeam
      );
      const playersNotInOriginal = findPlayersNotInOptimized(
        optimizedTeam,
        originalTeam
      );

      console.log("After findPlayersNotInOptimized");
      console.log("Players Out:", playersNotInOptimized);
      console.log("Players In:", playersNotInOriginal);

      setPlayersIn(playersNotInOriginal);
      setPlayersOut(playersNotInOptimized);
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
      // Handle error based on error.response or error.message
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(error.response.data);
        console.error(error.response.status);
        console.error(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const teamDict = {
    1: "arsenal",
    2: "aston_villa",
    3: "bournemouth",
    4: "brentford",
    5: "brighton",
    6: "chelsea",
    7: "crystal_palace",
    8: "everton",
    9: "fulham",
    10: "ipswich",
    11: "leicester",
    12: "liverpool",
    13: "man_city",
    14: "man_utd",
    15: "newcastle",
    16: "nottm_forest",
    17: "southampton",
    18: "spurs",
    19: "west_ham",
    20: "wolves",
  };

  // Create an object to hold the imported SVGs
  const crests = {
    arsenal,
    aston_villa: astonVilla,
    bournemouth,
    brentford,
    brighton,
    chelsea,
    crystal_palace: crystalPalace,
    everton,
    fulham,
    ipswich,
    leicester,
    liverpool,
    man_city: manCity,
    man_utd: manUtd,
    newcastle,
    nottm_forest: nottmForest,
    southampton,
    spurs,
    west_ham: westHam,
    wolves,
  };

  function PlayerRow({ players, position, teamDict, crests }) {
    return (
      <div className="flex justify-center">
        {players
          .filter((player) => player["position"] === position)
          .map((player, index) => (
            <div
              key={`${player.id}-${index}`}
              className="flex flex-col items-center text-center p-1.5 text-xs font-bold w-1/5 space-y-1"
            >
              <img
                src={crests[teamDict[player["team"]]]} // Use the correct crest or fallback to arsenal
                alt={`${teamDict[player["team"]]} crest`}
                onError={(e) => {
                  console.log(e.target.error);
                }} // Fallback to arsenal if the crest fails to load
              />
              <div className="w-4/5 rounded border border-slate-400 shadow-md shadow-stone-700">
                <div className="bg-slate-50 border-b border-slate-400 rounded-t">
                  {player.name}
                </div>
                <div className="bg-slate-50">£{player.cost}</div>
                <div className="bg-slate-300 border-t border-slate-400 rounded-b">
                  {Math.round(player.expected_points)}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  }

  // Calculate the sum of expected points for the original team
  const sumOriginalXVPoints = Math.round(
    originalXV.reduce((total, player) => {
      return total + player.expected_points; // Access the 'expected_points' key
    }, 0)
  );
  const sumOriginalXVCost = Math.round(
    originalXV.reduce((total, player) => {
      return total + player.cost; // Access the 'expected_points' key
    }, 0)
  );

  const sumOptimizedXVPoints = Math.round(
    optimizedXV.reduce((total, player) => {
      return total + player.expected_points; // Access the 'expected_points' key
    }, 0)
  );

  const sumOptimizedXVCost = Math.round(
    optimizedXV.reduce((total, player) => {
      return total + player.cost; // Access the 'expected_points' key
    }, 0)
  );

  function findPlayersNotInOptimized(original, optimized) {
    const optimizedIds = new Set(optimized.map((player) => player.name));
    console.log("Optimized IDs:", optimizedIds); // Debug log to check the IDs in the set

    // Filter players not in optimized and sort by position
    const playersNotInOptimized = original
      .filter((player) => !optimizedIds.has(player.name))
      .sort((a, b) => a.position - b.position); // Sort by position in non-decreasing order
    console.log("Filtered Players:", playersNotInOptimized); // Debug log to check the filtered players

    return playersNotInOptimized;
  }

  // useEffect(() => {
  //   const playersNotInOptimized = findPlayersNotInOptimized(
  //     originalXV,
  //     optimizedXV
  //   );
  //   const playersNotInOriginal = findPlayersNotInOptimized(
  //     optimizedXV,
  //     originalXV
  //   );

  //   setPlayersIn(playersNotInOriginal);
  //   setPlayersOut(playersNotInOptimized);
  // }, [originalXV, optimizedXV]); // Add this useEffect hook

  const positionMap = {
    1: "GK",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return (
    <div className="h-screen">
      <div className="flex flex-row items-center justify-center h-1/8 w-full bg-purple-800">
        <img src={require("./FPL_logo.png")} alt="FPL Logo" className="h-3/4" />
        <form onSubmit={handleSubmit}>
          <div className="flex flex-row p-6 items-center w-full justify-center">
            <div className="flex flex-col py-2 px-1 space-y-2 items-center">
              <label className="font-bold text-white">Your team ID:</label>
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="border-2 w-3/4 p-1 rounded-xl border-slate-400"
                placeholder="e.g. 447588"
              />
            </div>
            <div className="flex flex-col p-2 space-y-2 items-center">
              <label className="font-bold text-white">Free transfers:</label>
              <input
                value={freeTransfers}
                onChange={(e) => setFreeTransfers(e.target.value)}
                className="border-2 w-12 px-2 py-1 rounded-xl border-slate-400"
                type="number"
                max={5}
                min={0}
              />
            </div>
            <div className="pl-10">
              <button
                type="submit"
                className="bg-cyan-500 h-1/2 text-white p-2 rounded-lg font-bold shadow-xl"
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="flex flex-col w-full h-7/8 items-center bg-slate-50 space-y-2 pt-3">
        {loading ? (
          <div className="flex flex-1 w-full items-center justify-center">
            <RotatingLines
              visible={true}
              height="100"
              width="100"
              strokeColor="#6B21A8"
              strokeWidth="5"
              animationDuration="0.75"
              ariaLabel="rotating-lines-loading"
            />
          </div>
        ) : (
          <div className="flex flex-row flex-1 w-full h-7/8">
            {originalXV.length > 0 && (
              <div className="flex flex-col items-center w-3/8 space-y-4 h-full">
                <div className="flex flex-col items-center p-2 h-1/10">
                  <div className="underline text-lg font-bold">Current XV:</div>
                  <div className="font-bold text-lg">Value: £{sumOriginalXVCost} million</div>
                </div>
                <div
                  className="border-2 border-slate-500 rounded-lg py-7 shadow shadow-slate-500 h-4/5"
                  style={{
                    backgroundImage: `url(${require("./crests/football-pitch.png")})`,
                    backgroundSize: "cover", // Resize the background image to cover the entire container
                    backgroundRepeat: "no-repeat", // Do not repeat the image
                    backgroundPosition: "center", // Center the image
                  }}
                >
                  <PlayerRow
                    players={originalXV}
                    position={1}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={originalXV}
                    position={2}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={originalXV}
                    position={3}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={originalXV}
                    position={4}
                    teamDict={teamDict}
                    crests={crests}
                  />
                </div>
                <div className="flex flex-row space-x-3 text-lg p-2 h-1/10">
                  <div className="underline font-bold">Expected Points: </div>
                  <div className="font-normal">{sumOriginalXVPoints}</div>
                </div>
              </div>
            )}
            {originalXV.length > 0 && optimizedXV.length > 0 && (
              <div className="flex flex-col items-center justify-center w-1/4">
                <div className="underline text-lg p-2 font-bold">
                  Transfers:
                </div>
                <div className="flex flex-col w-11/12 border-2 border-slate-400 rounded-lg h-2/3 bg-white">
                  <div className="flex flex-row w-full h-1/12 border-b-2 border-slate-400">
                    <div className="flex items-center justify-center font-bold w-1/2">
                      Out
                    </div>
                    <div className="flex items-center justify-center font-bold w-1/2">
                      In
                    </div>
                  </div>
                  <div className="flex flex-row w-full h-11/12">
                    <div className="flex flex-col w-1/2 border-r-2 border-slate-400">
                      {playersOut.length > 0 && (
                        <div className="flex flex-col w-full text-xs">
                          <div>
                            {playersOut.map((player) => (
                              <div
                                key={player.id}
                                className="flex flex-row p-2 px-1.5 w-full"
                              >
                                <div className="w-1/5 font-bold text-left self-center">
                                  {positionMap[player.position]}
                                </div>
                                <div className="w-3/5 text-center">
                                  {player.name}
                                </div>
                                <div className="w-1/5 text-end font-bold self-center">
                                  £{player.cost}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col w-1/2">
                      {playersIn.length > 0 && (
                        <div className="flex flex-col  w-full text-xs">
                          <div>
                            {playersIn.map((player) => (
                              <div
                                key={player.id}
                                className="flex flex-row p-2 px-1.5 w-full"
                              >
                                <div className="w-1/5 font-bold text-left self-center">
                                  {positionMap[player.position]}
                                </div>
                                <div className="w-3/5 text-center">
                                  {player.name}
                                </div>
                                <div className="w-1/5 text-end font-bold self-center">
                                  £{player.cost}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {optimizedXV.length > 0 && (
              <div className="flex flex-col items-center w-3/8 space-y-4 h-full">
                <div className="flex flex-col items-center p-2 h-1/10">
                  <div className="underline text-lg font-bold">Optimized XV:</div>
                  <div className="font-bold text-lg">Value: £{sumOptimizedXVCost} million</div>
                </div>
                <div
                  className="border-2 border-slate-500 rounded-lg py-7 shadow shadow-slate-500 h-4/5"
                  style={{
                    backgroundImage: `url(${require("./crests/football-pitch.png")})`,
                    backgroundSize: "cover", // Resize the background image to cover the entire container
                    backgroundRepeat: "no-repeat", // Do not repeat the image
                    backgroundPosition: "center", // Center the image
                  }}
                >
                  <PlayerRow
                    players={optimizedXV}
                    position={1}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={optimizedXV}
                    position={2}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={optimizedXV}
                    position={3}
                    teamDict={teamDict}
                    crests={crests}
                  />
                  <PlayerRow
                    players={optimizedXV}
                    position={4}
                    teamDict={teamDict}
                    crests={crests}
                  />
                </div>
                <div className="flex flex-row space-x-2 text-lg p-2 h-1/10">
                  <div className="underline font-bold">Expected Points: </div>
                  <div className="font-normal">{`${sumOptimizedXVPoints} - 4 * (${playersIn.length} - ${freeTransfers}) = ${expectedPoints}`}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
