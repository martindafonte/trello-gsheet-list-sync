//---------------------------------
//Funciones principales
//-----------------------------------
function addMissingThings() {
    var error = checkControlValues(true, true);
    if (error != "") {
        sendError("ERROR:Values in the Control sheet have not been set. Please fix the following error:\n " + error);
        return;
    }
    // Get Data 
    var allData = getBackupData(CacheService.getScriptCache().get("boardId"), "?cards=open&card_attachments=true&lists=open&card_checklists=all");

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
    if (card.id == templateCard.id || !templateCard.id || card.idList == CacheService.getScriptCache().get("cardId")) {
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


function getTemplateForCard(card, templates) {
    if (templates && templates.length == 0)
        return [];
    else if (templates.length == 1 && templates[0].isForAllCards == true)
        return templates[0];
    for (var i = 0; i < templates.length; i++)
      if (card.list && templates[i].name.trim() === card.list.name.trim())
      return templates[i];
    var defaultTemplate = templates.filter(function(x){x.name.toString().indexOf(CTS.defaultTemplate)===0});
    if (defaultTemplate && defaultTemplate.length > 0)
      return defaultTemplate[0];
    return [];
  }


  function syncChecklistItems(card, templateChecklist, matchingChecklist) {
    /*for (var i = 0; i < templateChecklist.checkItems.length; i++) {
      var checkItemFound = false;
      for (var j = 0;
           (j < matchingChecklist.checkItems.length && !checkItemFound); j++) {
        if (matchingChecklist.checkItems[j].name == templateChecklist.checkItems[i].name) {
          checkItemFound = true;
          if (templateChecklist.checkItems[i].state == "complete")
            deleteChecklistItem(matchingChecklist.id, matchingChecklist.checkItems[j].id);
        }
        if (templateChecklist.checkItems[i].state == "incomplete" && !checkItemFound)
          addChecklistItem(matchingChecklist.id, templateChecklist.checkItems[i].name);
      }
    }
    */
  }