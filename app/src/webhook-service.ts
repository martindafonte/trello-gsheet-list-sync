// ------------------------------------------------------------------------------------
// Functions to process Webapp requests:
// ------------------------------------------------------------------------------------

// This GET is needed for Trello to make sure that the Web-app exists:

function doGet(e) {

    var x = HtmlService.createHtmlOutput("<p>Hello World!</p>");

    return x;
}


/**
 * This POST is what does all the hard work:
 * @param {*} data 
 */
function doPost(data) {

    var c = data.postData.getDataAsString();
    var action = JSON.parse(c).action;

    if (PropertiesService.getUserProperties().getProperty("logPost") == "Y") {
        logPost(c);
    }

    //  We're only interested in actions relating to a card being created on the board.
    if (action.type == "emailCard" || action.type == "createCard" || action.type == "updateCard" || action.type == "copyCard" || action.type == "moveCardToBoard" || action.type == "convertToCardFromCheckItem" || action.type == "moveListToBoard") {
        if (action.type == "updateCard" && action.data.listAfter) {
            action.type = "updateCard:idList";
        }
        processCardFromWebhook(action.data.card.id, action.type);
    }

    var x = HtmlService.createHtmlOutput("<p>Roger That</p>")
    return x;

}

function test_processCardFromWebhook() {

    processCardFromWebhook("xxxxxxxxxxxxxxxxxxxx", "moveCard");
}


function processCardFromWebhook(cardId, actionType) {

    var error = checkControlValues(true, true);
    if (error != "") {
        sendError("ERROR:Values in the Control sheet have not been set. Please fix the following error:\n " + error);
        return;
    }

    var url = constructTrelloURL("cards/" + cardId + "?attachments=true&lists=all&list=true&checklists=all");
    var resp = UrlFetchApp.fetch(url, {
        "method": "get"
    });
    var card = JSON.parse(resp.getContentText());

    url = constructTrelloURL("cards/" + cardId + "/checklists/");
    resp = UrlFetchApp.fetch(url, {
        "method": "get"
    });
    //var checklists = JSON.parse(resp.getContentText());

    var templates = getAvailableTemplates();
    var templateCard = getTemplateForCard(card, templates);

    //var checklistIds  = getChecklistIds(checklists);

    processCard(card, templateCard, actionType);

}


/**
 * Allow registering a web hook to trello
 */
function registerWebhook() {

    var url = ScriptApp.getService().getUrl();

    if (url == null || url == "") {

        Browser.msgBox("Please follow instructions on how to publish the script as a web-app: http://www.littlebluemonkey.com");
        return;

    }

    //------------------------------

    var error = checkControlValues(false, true);
    var trelloUrl = constructTrelloURL("webhooks/?callbackURL=" + encodeURIComponent(url) + "&idModel=" + CacheService.getScriptCache().get("boardId").trim());
    //UrlFetchApp is a google app script tool
    var resp = UrlFetchApp.fetch(trelloUrl, {
        "method": "post",
        "muteHttpExceptions": false
    });


    if (resp.getResponseCode() == 200) {
        Browser.msgBox("Webhook successfully registered! PLEASE make sure you change the authorities on the script (See documentation) to allow the webhook callback to work.");
    } else if (resp.getContentText().indexOf("did not return 200 status code, got 403") > 0) {
        Browser.msgBox("Webhook registration failed - HTTP:" + resp.getResponseCode() + ":" +
            " It looks like you need to republish your script with the correct authorities. Please refer to the section in the spreadsheet about generation webhooks. Response from Trello was: " +
            resp.getContentText());
    } else {
        Browser.msgBox("Webhook registration failed - HTTP:" + resp.getResponseCode() + ":" + resp.getContentText());
    }
}

function deleteWebhooks() {

    var error = checkControlValues(false, true);
    if (error != "") {
        Browser.msgBox(error);
        return;
    }
    var webhooks = getWebhooksForToken();
    var deleteCount = 0;

    for (var i = 0; i < webhooks.length; i++) {

        var url = "https://trello.com/1/token/" + CacheService.getScriptCache().get("token") + "/webhooks/" + webhooks[i].id + "?key=" + CacheService.getScriptCache().get("appKey");
        var resp = UrlFetchApp.fetch(url, {
            "method": "delete"
        });
        if (resp.getResponseCode() == 200) {
            deleteCount += 1;
        }

    }

    if (webhooks.length == 0) {
        Browser.msgBox("No webhooks found registered against token " + CacheService.getScriptCache().get("token"));
    } else {
        Browser.msgBox(webhooks.length + " webhook(s) found for token " + CacheService.getScriptCache().get("token") + " and " + deleteCount + " successfully deleted.");
    }
}