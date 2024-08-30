// Manually import SVGs
import arsenal from "../crests/arsenal.svg";
import astonVilla from "../crests/aston_villa.svg";
import bournemouth from "../crests/bournemouth.svg";
import brentford from "../crests/brentford.svg";
import brighton from "../crests/brighton.svg";
import chelsea from "../crests/chelsea.svg";
import crystalPalace from "../crests/crystal_palace.svg";
import everton from "../crests/everton.svg";
import fulham from "../crests/fulham.svg";
import ipswich from "../crests/ipswich.svg";
import leicester from "../crests/leicester.svg";
import liverpool from "../crests/liverpool.svg";
import manCity from "../crests/man_city.svg";
import manUtd from "../crests/man_utd.svg";
import newcastle from "../crests/newcastle.svg";
import nottmForest from "../crests/nottm_forest.svg";
import southampton from "../crests/southampton.svg";
import spurs from "../crests/spurs.svg";
import westHam from "../crests/west_ham.svg";
import wolves from "../crests/wolves.svg";

function TeamView({ team, status, playersIn, freeTransfers, expectedPoints }) {
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
  const sumTeamPoints = Math.round(
    team.reduce((total, player) => {
      return total + player.expected_points; // Access the 'expected_points' key
    }, 0)
  );
  const sumTeamCost = Math.round(
    team.reduce((total, player) => {
      return total + player.cost; // Access the 'cost' key
    }, 0)
  );
  

  return (
    <>
      {team.length > 0 && (
        <div className="flex flex-col items-center w-3/8 space-y-4 h-full">
          <div className="flex flex-col items-center p-2 h-1/10">
            <div className="underline text-lg font-bold">
              {status == "current" ? "Current XV:" : "Optimized XV:"}
            </div>
            <div className="font-bold text-lg">
              Value: £{sumTeamCost} million
            </div>
          </div>
          <div
            className="border-2 border-slate-500 rounded-lg py-7 shadow shadow-slate-500 h-4/5"
            style={{
              backgroundImage: `url(${require("../crests/football-pitch.png")})`,
              backgroundSize: "cover", // Resize the background image to cover the entire container
              backgroundRepeat: "no-repeat", // Do not repeat the image
              backgroundPosition: "center", // Center the image
            }}
          >
            <PlayerRow
              players={team}
              position={1}
              teamDict={teamDict}
              crests={crests}
            />
            <PlayerRow
              players={team}
              position={2}
              teamDict={teamDict}
              crests={crests}
            />
            <PlayerRow
              players={team}
              position={3}
              teamDict={teamDict}
              crests={crests}
            />
            <PlayerRow
              players={team}
              position={4}
              teamDict={teamDict}
              crests={crests}
            />
          </div>
          <div className="flex flex-row space-x-3 text-lg p-2 h-1/10">
            <div className="underline font-bold">Expected Points: </div>
            {status == "current" ? (
              <div className="font-normal">{sumTeamPoints}</div>
            ) : (
              <div className="font-normal">{`${sumTeamPoints} - 4 * (${playersIn.length} - ${freeTransfers}) = ${expectedPoints}`}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TeamView;
