// UX is everywhere -- server

Meteor.startup(function () {
  console.log("server startup");
});

Meteor.publish("leaderboard", function () {
  return Players.find({}, {sort: {score: -1, name: 1}});
});

Meteor.publish("challenges", function () {
  return Challenges.find({owner: this.userId});
});

// raw data for challenges -- open, locked, completed
var challenges = [
  {
    person: 'Nicole',
    gender: 'her',
    secret: 'seattleux',
    category: 'discover',
    img: '/img/nicole-lit.jpg',
    points: 100,
    status: "open" 
  },
  {
    person: 'Gary',
    gender: 'his',
    secret: 'seattleux',
    category: 'design',
    img: '/img/gary-lit.jpg',
    points: 100,
    status: "locked"
  },
  {
    person: 'Barb',
    gender: 'her',
    secret: 'seattleux',
    category: 'deliver',
    img: '/img/barb-lit.jpg',
    points: 100,
    status: "locked"
  },
  {
    person: 'Ed',
    gender: 'his',
    secret: 'seattleux',
    category: 'discover',
    img: '/img/ed-lit.jpg',
    points: 100,
    status: "open"
  },
  {
    person: 'Marisa',
    gender: 'her',
    secret: 'seattleux',
    category: 'design',
    img: '/img/marisa-lit.jpg',
    points: 100,
    status: "locked"
  },
  {
    person: 'Jim',
    gender: 'his',
    secret: 'seattleux',
    category: 'deliver',
    img: '/img/jim-lit.jpg',
    points: 100,
    status: "locked"
  }];

Meteor.methods({
  // options should include: name
  createPlayer: function (options) {
    console.log('createPlayer');
    options = options || {};
    if (!(typeof options.name === "string" && options.name.length)) {
      throw new Meteor.Error(400, "Required parameter missing");
    }
    if (!this.userId) {
      throw new Meteor.Error(403, "You must be logged in");
    }
    if (Players.find({owner:this.userId}).count() > 0) {
      throw new Meteor.Error(500, "Player already exists");
    }

    // create challenges for this player
    for (var i = 0; i < challenges.length; i++) {
      var ch = challenges[i];
      Challenges.insert({
        owner: this.userId,
        order: i,
        person: ch.person,
        gender: ch.gender,
        secret: ch.secret,
        category: ch.category,
        img: ch.img,
        points: ch.points,
        status: ch.status
      });
    }

    // create and return this player
    return Players.insert({
      owner: this.userId,
      name: options.name,
      score: 0,
      bonus_discover: false,
      bonus_design: false,
      bonus_deliver: false,
      bonus_done: false
    });
  },

  grantPoints: function (points, playerid) {
    var searchkey = {owner: this.userId};
    if (playerid && typeof playerid !== "undefined") {
      searchkey = playerid;
    }
    Players.update(searchkey, {$inc: {score: points}});
  },

  completeChallenge: function (challenge) {
    console.log('completeChallenge');
    var player = Players.findOne({owner: this.userId});
    if (!player || typeof player === "undefined") {
      throw new Meteor.Error(500, "No player with id: " + this.userId);
    }
    if (challenge.owner !== player.owner) {
      throw new Meteor.Error(403, "You're trying to change another player's challenge");
    }

    // give player points, mark challenge as completed, track category
    Meteor.call("grantPoints", challenge.points);
    Challenges.update(challenge._id, {$set: {
      status: "completed",
      img: challenge.img.split('.')[0] + "-done.jpg"
    }});
    switch (challenge.category) {
      case 'discover':
        Players.update({owner: this.userId}, {$set: {bonus_discover: true}});
        break;
      case 'design':
        Players.update({owner: this.userId}, {$set: {bonus_design: true}});
        break;
      case 'deliver':
        Players.update({owner: this.userId}, {$set: {bonus_deliver: true}});
        break;
    }

    // update player
    player = Players.findOne({owner: this.userId});

    // game rules
    // get extra points for completing all stages
    if (Challenges.find({owner: this.userId, status: "completed"}).count() ===
        Challenges.find({owner: this.userId}).count()) {
      Meteor.call("grantPoints", 1000);
      return {"msg": "UX Wizard! You get an extra 1000 points for completing the entire UX scavenger hunt."};
    }

    // get extra points for completing at least one of each
    else if (player.bonus_discover && player.bonus_design && player.bonus_deliver && !player.bonus_done) {
      Meteor.call("grantPoints", 500);
      Players.update({owner: this.userId}, {$set: {bonus_done: true}});
      return {"msg": "UX Master! You get an extra 500 points for finding one secret in each stage."};
    }

    // get extra points for completing an entire stage
    else if (Challenges.find({
        owner: this.userId, category: challenge.category, status: "completed"
      }).count() === Challenges.find({
        owner: this.userId, category: challenge.category
      }).count()) {
      Meteor.call("grantPoints", 200);
      return {"msg": "UX Pro! You get an extra 200 points for completing the entire "
        + challenge.category + " stage."};
    }

    // unlock the next stage after first challenged solved
    else if (challenge.category !== "deliver" && 
      Challenges.find({
        owner: this.userId, category: challenge.category, status: "completed"
      }).count() === 1) {
      var unlock = "design";
      if (challenge.category === "design") {
        unlock = "deliver";
      }
      Challenges.update({owner: this.userId, category: unlock},
        {$set: {status: "open"}}, {multi:true});
      return {"msg": "Congrats! You've earned 100 points and unlocked the next stage."};
    }

    // just get some points, no special case
    return {"msg": "100 points!"};

    // things that are happening for this player:
    // may get XXXtra points for completing all three stages - if all challenges are completed
    // XXXtra points for 1st challenge completed - when exactly one challenge has been completed, total
  }

});
