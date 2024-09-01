// Component showing transfers information

function Transfers({ playersIn, playersOut }) {
  const positionMap = {
    1: "GK",
    2: "DEF",
    3: "MID",
    4: "FWD",
  };

  return (
    <>
      {playersIn.length > 0 && playersOut.length > 0 && (
        <div className="flex flex-col items-center justify-center w-1/5">
          {/* <div className="underline text-lg p-2 font-bold">Transfers:</div> */}
          <div className="flex flex-col border-2 border-slate-400 rounded-lg h-2/3 bg-white">
            <div className="flex flex-row h-1/12 border-b-2 border-slate-400">
              <div className="flex items-center justify-center font-black w-1/2 text-red-600">
                Out
              </div>
              <div className="flex items-center justify-center font-black w-1/2 text-green-600">
                In
              </div>
            </div>
            <div className="flex flex-row w-full h-11/12">
              <div className="flex flex-col w-1/2 border-r-2 border-slate-400">
                <div className="flex flex-col w-full text-xs">
                  <div>
                    {playersOut.map((player) => (
                      <div
                        key={player.id}
                        className="flex flex-row justify-between py-2 pr-2 pl-1 w-full"
                      >
                        <div className="w-1/5 font-bold text-left">
                          {positionMap[player.position]}
                        </div>
                        <div className="w-3/5 text-center px-2">{player.name}</div>
                        <div className="w-1/5 font-bold text-end">
                          £{player.cost}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-1/2">
                <div className="flex flex-col  w-full text-xs">
                  <div>
                    {playersIn.map((player) => (
                      <div
                        key={player.id}
                        className="flex flex-row justify-between py-2 pr-2 pl-1 w-full"
                      >
                        <div className="w-1/5 font-bold text-left">
                          {positionMap[player.position]}
                        </div>
                        <div className="w-3/5 text-center px-2">{player.name}</div>
                        <div className="w-1/5 text-end font-bold">
                          £{player.cost}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Transfers;
