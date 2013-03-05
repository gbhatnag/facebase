// UX IS EVERYWHERE -- client

var playersub    = Meteor.subscribe("leaderboard"),
    challengesub = Meteor.subscribe("challenges");

Meteor.startup(function () {
  console.log('client startup');
  Session.set("challenge_selected", null);
  Session.set("leaderboard", null);
});

// Global state and helper functions
var signupfailed = false,
    challengefailed = false,
    dialog_overlay = null,
    cached = [],
    getDialogOverlay = function () {
      if (!dialog_overlay || dialog_overlay.length === 0) {
        dialog_overlay = $("#dialog_overlay");
        dialog_overlay.click(function () {
          return false;
        });
      }
      return dialog_overlay;
    },
    hideChallenge = function () {
      cached["#challenge_dialog"].fadeOut(250);
      getDialogOverlay().fadeOut(250);
    },
    showmsg = function (msg) {
      alert(msg);
    };

// template functions & events
Template.header.player = function () {
  console.log("getting player data");
  return Players.findOne({owner: Meteor.userId()});
};

Template.header.events({
  'click #scoreboard': function () {
    getDialogOverlay().fadeIn(250);
    $("#leaderboard").fadeIn(250);
    Session.set("leaderboard", "open");
    return false;
  }
});

Template.signup.rendered = function () {
  console.log('signup rendered');
  if (Meteor.loggingIn()) {
    return;
  }

  var content = $("#signup");
  content.fadeIn(250);
  content.validate({
    invalidHandler: function(form, validator) {
      signupfailed = true;
      alert("Please enter a valid email address @slalom.com");
      return false;
    },
    errorPlacement: function(error, element) {
      return false;
    },
    success: function () {
      signupfailed = false;
    }
  });
};

Template.signup.events({
  'submit #signup': function () {
    if (signupfailed) {
      return false;
    }
    console.log('submit');
    var email = $.trim($("#email").val());
    // TODO more error checking (i.e. only text + dots...)
    if (email && email !== '') {
      // create a new user w/random password, log them in, show an alert, move the screen.
      Accounts.createUser({
        username: email,
        email: email + "@slalom.com",
        password: Random.id()
      }, function (err) {
        if (err) {
          console.log("ERROR: " + err.reason);
        } else {
          console.log("successfully created new user - you'll be sent a password via email in case you need to log in later!");
          Meteor.call('createPlayer', {name: email}, function (err, player) {
            if (err) {
              console.log("ERROR: " + err.reason)
            } else {
              console.log('created player');
              Meteor.call('grantPoints', 100, player);
            }
          });
        }
      });
    }
    return false;
  }
});

Template.gameboard.rendered = function () {
  console.log('rendered board');
  var content = $("#gameboard");
  if (!content.is(":visible")) {
    content.fadeIn(250);
  }
};

Template.gameboard.challenges = function () {
  return Challenges.find({owner: Meteor.userId()}, {sort: {order: 1}});
};

Template.gameboard.events({
  'click img': function (ev) {
    if ($(ev.target).hasClass('locked')) {
      alert("Complete an open challenge to unlock me!");
      return;
    }
    Session.set("challenge_selected", null);
    Session.set("challenge_selected", this);
  }
});

Template.challenge.challenge = function () {
  return Challenges.findOne(Session.get("challenge_selected"));
};

Template.challenge.completed = function () {
  return this.status === "completed";
};

Template.challenge.rendered = function () {
  if (!Session.get("challenge_selected")) {
    return;
  }
  cached["#challenge_dialog"] = $("#challenge_dialog");
  $("#secret").val("");
  getDialogOverlay().fadeIn(250);
  cached["#challenge_dialog"].fadeIn(250, function () {
    $("#challenge_form").validate({
      invalidHandler: function(form, validator) {
        challengefailed = true;
        alert("You're going to need that secret to get the points!");
        return false;
      },
      errorPlacement: function(error, element) {
        return false;
      },
      success: function () {
        challengefailed = false;
      }
    });
  });
};

Template.challenge.events({
  'click #challenge_close': function () {
    hideChallenge();
  },

  'submit #challenge_form': function () {
    if (challengefailed) {
      return false;
    }
    var secret = $.trim($("#secret").val()).toLowerCase(),
        ch = Challenges.findOne(Session.get("challenge_selected"));

    if (secret !== ch.secret) {
      alert("Good guess, but that's not " + ch.person + "'s UX secret. Typo?");
      return false;
    }

    Meteor.call('completeChallenge', ch, function (err, data) {
      alert(data.msg);
    });
    hideChallenge();
    // change nicole's picture
    // potentially open up another category
    // when they're done with the whole game... they're a UX Master - everything turns to gold
    // ^- you're going to have to tell them these things are happening - dialog/alert?
    Session.set("challenge_selected", null);
    return false;
  }
});

Template.leaderboard.style = function () {
  return Session.get("leaderboard") ? "" : 'display:none;';
};

Template.leaderboard.players = function () {
  var ranknum = 1;
  return Players.find({}, {sort: {score: -1, name: 1}, limit: 10}).map(function (player) {
    return {
      me: player.owner === Meteor.userId() ? "me" : "",
      rank: ranknum++,
      name: player.name.split("@")[0],
      score: player.score
    };
  });
};

Template.leaderboard.events({
  'click #leaderboard_close': function () {
    $("#leaderboard").fadeOut(250);
    getDialogOverlay().fadeOut(250);
    Session.set("leaderboard", null);
    return false;
  }
});

