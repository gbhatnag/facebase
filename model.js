// UX IS EVERYWHERE -- data model
// Loaded on both the client and the server

///////////////////////////////////////////////////////////////////////////////
// Players

var Players = new Meteor.Collection("players");
var Challenges = new Meteor.Collection("challenges");

Meteor.methods({
  // options should include: name
  createPlayer: function (options) {
    options = options || {};
    if (!(typeof options.name === "string" && options.name.length)) {
      throw new Meteor.Error(400, "Required parameter missing");
    }
    if (!this.userId) {
      throw new Meteor.Error(403, "You must be logged in");
    }

    return Players.insert({
      owner: this.userId,
      name: options.name,
      challenges: [],
      score: 0
    });
  },

  grantPoints: function (points, playerid) {
    var searchkey = {owner: Meteor.userId()};
    if (playerid && typeof playerid !== "undefined") {
      searchkey = playerid;
    }
    Players.update(searchkey, {$inc: {score: points}});
  },

  completeChallenge: function (playerid, challenge) {

  }
});
