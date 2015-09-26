
var ogsOverviewURL = 'https://online-go.com/api/v1/ui/overview?format=json';
var ogsPlayerInfoURL = 'https://online-go.com/api/v1/me/settings?format=json';
var ogsSiteURL = 'https://online-go.com/';

const COLOR_RED = '#FF0000';
const COLOR_GREEN = '#00FF00';
const COLOR_GREY = '#AAAAAA';

const CHECK_INTERVAL_MS = 5000;
const REINIT_ON_FAILURE_PAUSE_MS = 10000;

const ERROR_STATUS = '!';

/**
 * @return Promise
 */
function getJSON(url) {
  'use strict';
  var xhr = new XMLHttpRequest();
  var d = Promise.defer();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        d.resolve(JSON.parse(xhr.responseText));
      } else {
        d.reject(xhr.responseText);
      }
    }
  };
  xhr.open('GET', url);
  xhr.send();
  return d.promise;
}

var USER_PLAYER_ID = null;

function setStatus(text, color) {
  chrome.browserAction.setBadgeBackgroundColor({ color: color });
  chrome.browserAction.setBadgeText({ text: text });
}

var setErrorStatus = setStatus.bind(null, ERROR_STATUS, COLOR_RED);

function isActiveGame(currentUserId, gameData) {
  return gameData.json.clock.current_player == currentUserId;
}

function countTrue(list) {
  return list.reduce((sum, x) => x ? sum+1 : sum, 0);
}

function updateNotificationArea(userPlayerId) {
	getJSON(ogsOverviewURL)
    .then(
      (overview) => {
        var games = overview.active_games || [];
        var totalGames = games.length,
            waitingGames = countTrue(games.map(isActiveGame.bind(null, userPlayerId)));
        
        var status = waitingGames + '/' + totalGames;
        if (waitingGames) {
          setStatus(status, COLOR_GREEN);
        } else {
          setStatus(status, COLOR_GREY);
        }
      },
      () => setErrorStatus()
    );
}

function init() {
  getJSON(ogsPlayerInfoURL)
    .then(
      (playerInfo) => {
        setInterval(updateNotificationArea.bind(null, playerInfo.profile.id), CHECK_INTERVAL_MS);
      },
      () => {
        setErrorStatus()
        setTimeout(init, REINIT_ON_FAILURE_PAUSE_MS);
      }
    );
}

function openOGS() {
  chrome.tabs.create({
    url: ogsSiteURL
  });
}

chrome.browserAction.onClicked.addListener(openOGS);
init();
