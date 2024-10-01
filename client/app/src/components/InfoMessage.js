import React from 'react';

function InfoMessage() {
  return (
    <div className="w-1/2 h-3/5 bg-white rounded-2xl border border-gray-300 p-6">
      <h1 className="text-2xl font-bold mb-4  text-purple-800  text-center">Welcome to the FPL Optimizer App!</h1>
      <p className="text-base leading-relaxed">
        Looking to gain an edge in your Fantasy Premier League this season? This app combines mathematics and programming to help you optimize your team selections. By analyzing data from the official Premier League API and expected player performance, the optimizer provides suggestions to help you make informed transfer decisions.
      </p>
      <p className="text-base leading-relaxed mt-4">
        Simply enter your team ID, the number of free transfers you have, and the upcoming game week, and the app will generate an optimized team lineup for you. Please note, this is an experimental tool built for fun, so use it as inspiration for your own strategies. 
      </p>
      <p className="text-base leading-relaxed mt-4">
        To find your team ID, log into your FPL account, go to <strong>Pick Team</strong>, then click on <strong>Gameweek History</strong>. In your browser's URL bar, you'll see something like <em>https://fantasy.premierleague.com/entry/{'{'}teamId{'}'}/history</em>; your team ID is the number where <strong>teamId</strong> is located.
      </p>
      <p className="text-base leading-relaxed mt-4">
        Let's get started and see how we can help boost your team's performance this week!
      </p>
    </div>
  );
}

export default InfoMessage;