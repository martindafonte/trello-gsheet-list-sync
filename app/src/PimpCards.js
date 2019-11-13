//---------------------------------
//Funciones principales
//-----------------------------------
function pimpCardsNow() {
    addMissingThings();
    Browser.msgBox("Cards on board have been pimped!");
}

function addMissingThings() {
    var error = checkControlValues(true, true);
    if (error != "") {
        sendError("ERROR:Values in the Control sheet have not been set. Please fix the following error:\n " + error);
        return;
    }
    // Get Data 
    var allData = getBackupData(CacheService.getPrivateCache().get("boardId"), "?cards=open&card_attachments=true&lists=open&card_checklists=all");

    if (allData === null) {
        sendError("Unable to retrieve board card data - Pimping Aborted");
        Browser.msgBox("Unable to retrieve board card data - Pimping Aborted");
        return;
    }
    // Parse the data: 
    var cards = JSON.parse(allData).cards;
    var lists = JSON.parse(allData).lists;
    checkAllCards(cards, lists);
}

function checkAllCards(cards, lists) {
    var templates = getAvailableTemplates();
    var templateCard;
    for (var i = 0; i < cards.length; i++) {
        Logger.log("Processing Cards %s ", cards[i].id);
        cards[i].list = getListForId(cards[i].idList, lists);
        templateCard = getTemplateForCard(cards[i], templates);
        processCard(cards[i], templateCard, "refresh");

    }

}

function processCard(card, templateCard, actionType) {
    var addDescription = false;
    // Don't process template card
    if (card.id == templateCard.id || !templateCard.id || card.idList == CacheService.getPrivateCache().get("cardId")) {
        return;
    }
    if (actionType == "updateCard") {
        return;
    }

    // Use the description from the template if no current description:
    if (card.desc.trim() == "" && templateCard.desc.trim() != "") {
        addCardDescription(card, templateCard.desc.trim());
    }

    // Add any missing checklists/checklist items:
    checkForMissingChecklists(card, templateCard)
}

function getListForId(id, lists) {

    for (var i = 0; i < lists.length; i++) {
        if (lists[i].id == id) {
            return lists[i];
        }
    }
}

function checkForMissingChecklists(card, templateCard) {

    for (var i = 0; i < templateCard.checklists.length; i++) {
        var matchingChecklist = getMatchingCheckList(templateCard.checklists[i].name, card);
        if (matchingChecklist == null) {
            copyChecklist(card, templateCard.checklists[i].id, templateCard.checklists[i].name);
        } else {
            syncChecklistItems(card, templateCard.checklists[i], matchingChecklist);
        }
    }

}

function getMatchingCheckList(name, card) {
    var index = 0;
    for (var i = 0; i < card.checklists.length; i++) {

        if (card.checklists[i].name == name) {
            return card.checklists[i];
        }
    }
    return null;
}


