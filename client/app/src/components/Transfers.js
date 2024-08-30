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
        <div className="flex flex-col items-center justify-center w-1/4">
          <div className="underline text-lg p-2 font-bold">Transfers:</div>
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
                        <div className="w-3/5 text-center">{player.name}</div>
                        <div className="w-1/5 text-end font-bold self-center">
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
                        className="flex flex-row p-2 px-1.5 w-full"
                      >
                        <div className="w-1/5 font-bold text-left self-center">
                          {positionMap[player.position]}
                        </div>
                        <div className="w-3/5 text-center">{player.name}</div>
                        <div className="w-1/5 text-end font-bold self-center">
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
