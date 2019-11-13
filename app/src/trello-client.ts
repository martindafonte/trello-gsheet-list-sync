/// <reference path="./format-utils.ts" />
function addStateToCheckItem(cardId, checkItemId, state){
  var url = constructTrelloURL("cards/" + cardId + "/checkItem/"+checkItemId+"?state=" + encodeURIComponent(state));
  var resp = UrlFetchApp.fetch(url, {
    "method": "put"
  });
}

function addChecklist(card, name){
   var url = constructTrelloURL("checklists?name=" + encodeURIComponent(name) + "&idCard=" + card.id);
  var resp = UrlFetchApp.fetch(url, {
    "method": "post"
  });
  if (resp.getResponseCode() == 200) {
    return resp.getContentText();
  } else {
    sendError("Error retrieving backup data:" + resp.getResponseCode() + ":" + resp.getContentText());
    return null;
  }
}

function addChecklistItem(checklistId, name) { 
  var url = constructTrelloURL("checklists/" + checklistId + "/checkItems?name=" + encodeURIComponent(name));
  var resp = UrlFetchApp.fetch(url, {
    "method": "post"
  });
}

function deleteChecklistItem(checklistId, checklistItemId) {
  var url = constructTrelloURL("checklists/" + checklistId + "/checkItems/" + checklistItemId);
  var resp = UrlFetchApp.fetch(url, {
    "method": "delete"
  });
}

function addCardDescription(card, description) {
  
  var url = constructTrelloURL("cards/" + card.id + "?desc=" + encodeURIComponent(description));
  var resp = UrlFetchApp.fetch(url, {
    "method": "put"
  });
  
}

function updateCardName(card, newCardName) {
  
  var url = constructTrelloURL("card/" + card.id + "/name?value=" + encodeURIComponent(newCardName));
  var resp = UrlFetchApp.fetch(url, {
    "method": "put"
  });
  Logger.log("Updated card name");
}


function copyChecklist(card, fromChecklistId, fromCheckListName) {
  var url = constructTrelloURL("checklists?name=" + encodeURIComponent(fromCheckListName) + "&idCard=" + card.id + "&idChecklistSource=" + fromChecklistId);
  var resp = UrlFetchApp.fetch(url, {
    "method": "post"
  });
}

function getBackupData(boardID, data) {
  var url = constructTrelloURL("boards/" + boardID + data);
  var resp = UrlFetchApp.fetch(url, {
    "method": "get",
    "muteHttpExceptions": true
  });
  if (resp.getResponseCode() == 200) {
    return resp.getContentText();
  } else {
    sendError("Error retrieving backup data:" + resp.getResponseCode() + ":" + resp.getContentText());
    return null;
  }
}

function getAvailableTemplates() {
  var url = constructTrelloURL("cards/" + CacheService.getScriptCache().get("cardId") + "?lists=all&checklists=all&attachments=true");
  var resp = UrlFetchApp.fetch(url, {
    "method": "get",
    "muteHttpExceptions": true
  });
  if (resp.getResponseCode() == 200) { 
    var card = new Array();
    card[0] = JSON.parse(resp.getContentText());
    card[0].isForAllCards = true;
    card[0].checklists = card[0].checklists.sort(function (a, b) {
      return a.pos - b.pos;
    });
    return card;
  }
  // If couldn't find a card, then try a list:
  else {
    var url = constructTrelloURL("lists/" + CacheService.getScriptCache().get("cardId") + "/cards?checklists=all&attachments=true&list=true");
    var resp = UrlFetchApp.fetch(url, {
      "method": "get"
    });
    var cards = JSON.parse(resp.getContentText());
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].checklists && cards[i].checklists.length > 0) {
        cards[i].checklists = cards[i].checklists.sort(function (a, b) {
          return a.pos - b.pos;
        });
      }
    }
    return cards; 
  }
}

function constructTrelloURL(baseURL) {
  if(!CacheService.getScriptCache().get("appKey") || !CacheService.getScriptCache().get("token")){
    checkControlValues(true, true);
  }
  if (baseURL.indexOf("?") == -1) {
    return "https://trello.com/1/" + baseURL + "?key=" + CacheService.getScriptCache().get("appKey") + "&token=" + CacheService.getScriptCache().get("token");
  } else {
    return "https://trello.com/1/" + baseURL + "&key=" + CacheService.getScriptCache().get("appKey") + "&token=" + CacheService.getScriptCache().get("token");
  }
}

function getWebhooksForToken() {
  
  var url = "https://trello.com/1/token/" + CacheService.getScriptCache().get("token") + "/webhooks?key=" + CacheService.getScriptCache().get("appKey");
  var resp = UrlFetchApp.fetch(url, {
    "method": "get"
  });
  let webhooks = JSON.parse(resp.getContentText());
  return webhooks;
}

function listCurrentUserBoards() {
  
  var error = checkControlValues(false, false);
  if (error != "") {
    Browser.msgBox("ERROR:Values in the Control sheet have not been set. Please fix the following error:\n " + error);
    return [];
  }
  
  var url = constructTrelloURL("members/me/boards");
  var resp = UrlFetchApp.fetch(url, {
    "method": "get"
  });
  var values = JSON.parse(resp.getContentText())
  
  
  return values;
}

function listsForBoard(archivadas) {
  var error = checkControlValues(false, true);
  if (error != "") {
    Browser.msgBox("ERROR:Values in the Control sheet have not been set. Please fix the following error:\n " + error);
    return [];
  }
  var url = constructTrelloURL("boards/" + CacheService.getScriptCache().get("boardId") + "/lists?filter="+ (archivadas?"all": "open"));
  var resp = UrlFetchApp.fetch(url, {
    "method": "get"
  });
  var values = JSON.parse(resp.getContentText())
  return values;
}

function cardsForList(list, checklists = false){
  let checklistQueryString = checklists? "all" : "none";
  var url = constructTrelloURL("lists/" + list.id + "/cards?checklists="+checklistQueryString+"&attachments=false&list=true");
  var resp = UrlFetchApp.fetch(url, {
    "method": "get"
  });
  var cards = [];
  cards = JSON.parse(resp.getContentText());
  return cards;
}

//TODO ver si no es necesario agregar nuevos parámetros

/**
 * Check if all the parameters are specified on the sheet 
 * @param {boolean} requireCard 
 * @param {boolean} requireBoard 
 * @returns String with the result of the check
 */
function checkControlValues(requireCard, requireBoard) {
    var col = SpreadsheetApp.openById(PropertiesService.getUserProperties().getProperty("ssId")).getSheetByName(CTS.confighSheetName).getRange("B4:B20").getValues();
    var appKey = col[0][0].toString().trim();
    if (appKey == "") {
        return "App Key not found";
    }
    CacheService.getScriptCache().put("appKey", appKey,21600);
    var token = col[1][0].toString().trim();
    if (token == "") {
        return "Token not found";
    }
    CacheService.getScriptCache().put("token", token,21600);
    if (requireBoard) {
        var bid = col[2][0].toString().trim();
        if (bid == "") {
            return "Board ID not found";
        }
        CacheService.getScriptCache().put("boardId", bid,21600);
    }
    if (requireCard) {
        var lid = col[3][0].toString().trim();
        if (lid == "") {
            return "Template Card Id not found";
        }
        CacheService.getScriptCache().put("cardId", lid,21600);
    }
    PropertiesService.getUserProperties().setProperty("logPost", col[7][0].toString().trim());
    return "";
}