// All Tomorrow's Parties -- server

Meteor.startup(function () {
  if (Challenges.find().count() === 0) {
    var challenges = [
      {
        type:'text',
        prompt:'Enter the secret',
        secret:'observation',
        answer:'observation allows us to see the real life context...',
        points: 100
      }];
    for (var i = 0; i < challenges.length; i++) {
      var ch = challenges[i];
      Challenges.insert({
        cid: i,
        type: ch.type,
        prompt: ch.prompt,
        secret: ch.secret,
        answer: ch.answer,
        points: ch.points
      });
    }
  }
});