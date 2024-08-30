import { useState } from "react";
import axios from "axios";
import { RotatingLines } from "react-loader-spinner";
import TeamView from "./components/TeamView";
import Transfers from "./components/Transfers";
import Header from "./components/Header";

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
  const [gameWeek, setGameWeek] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let id = teamId;
    let transfers = freeTransfers;
    let week = gameWeek;

    // setTeamId("");
    // setFreeTransfers(0);
    setLoading(true);

    try {
      const response = await axios.get(
        `http://localhost:8000/optimize/${id}/${transfers}/${week}`
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

      const playersNotInOptimized = findPlayersNotInOptimized(
        originalTeam,
        optimizedTeam
      );
      const playersNotInOriginal = findPlayersNotInOptimized(
        optimizedTeam,
        originalTeam
      );

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

  return (
    <div className="h-screen">
      <Header
        teamId={teamId}
        freeTransfers={freeTransfers}
        gameWeek={gameWeek}
        setTeamId={setTeamId}
        setFreeTransfers={setFreeTransfers}
        setGameWeek={setGameWeek}
        handleSubmit={handleSubmit}
      />
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
              <TeamView
                team={originalXV}
                status={"current"}
                playersIn={playersIn}
                freeTransfers={freeTransfers}
                expectedPoints={expectedPoints}
              />
            )}
            <Transfers playersIn={playersIn} playersOut={playersOut} />
            {optimizedXV.length > 0 && (
              <TeamView
                team={optimizedXV}
                status={"optimized"}
                playersIn={playersIn}
                freeTransfers={freeTransfers}
                expectedPoints={expectedPoints}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
