// UX IS EVERYWHERE -- client

// Global state
var dotstransformed = false;
Meteor.startup(function () {
  console.log('meteor startup');
});

Template.header.player = function () {
  console.log("getting player data");
  return Players.findOne({owner: Meteor.userId()});
};

Template.header.events({
  'click #leaderboard-link': function () {
    $("#leaderboard").fadeIn(750);
    return false;
  }
});

Template.signup.transform = function () {
  console.log('fading');
  $("#signup").fadeOut(750, function () {
    $(this).remove();
  });
};

Template.signup.rendered = function () {
  console.log('signup rendered');
};

Template.signup.events({
  'submit #signup': function () {
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
          Template.dots.transform();
        }
      });
    }
    return false;
  }
});

Template.content.transform = function () {
  $("#discover").fadeIn(750);
};

Template.content.events({
  'submit #discover-challenge': function () {
    console.log('challenge submit');
    Meteor.call('grantPoints', 100);
    return false;
  }
});

Template.leaderboard.players = function () {
  return Players.find({}, {sort: {score: -1, name: 1}});
};

Template.leaderboard.events({
  'click #leaderboard a': function () {
    $("#leaderboard").fadeOut(750);
    return false;
  }
});

Template.dots.transform = function () {
  if (dotstransformed) {
    return;
  }
  dotstransformed = true;
  console.log('appending circles');
  var svg = d3.select("#dots"),
      design = svg.select("circle"),
      deliver = svg.append("circle")
        .attr("class", "dot")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", "3")
        .attr("r", "25%"),
      discover = svg.append("circle")
        .attr("class", "dot")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("stroke-width", "3")
        .attr("r", "25%"),
      circles = svg.selectAll(".dot");

  // shrink em
  circles.transition().duration(750).delay(0).attr("r", "16.5%");

  // move the left one out first, then right
  discover.transition().duration(750).delay(750).attr("cx", "16.5%");
  deliver.transition().duration(750).delay(950).attr("cx", "83.5%");

  // shrink the box
  svg.transition().duration(750).delay(1700).attr("height", "25%");
  circles.transition().duration(750).delay(1700).attr("r", "20%");

  // fade the signup box out
  //Meteor.setTimeout(Template.signup.transform, 2450);

  // fade the first piece of content in
  design.transition().duration(750).delay(2450).attr("fill", "#333");
  deliver.transition().duration(750).delay(2450).attr("fill", "#333");
  Meteor.setTimeout(Template.content.transform, 2450);
};

Template.dots.rendered = function () {
  if (Meteor.userId() !== null) {
    Template.dots.transform();
  }
};
