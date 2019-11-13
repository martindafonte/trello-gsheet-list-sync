/// <reference path="./../src/trello-client.ts" />
function testCall() {
    var listas = listsForBoard(false);
    var cards = cardsForList(listas[0], false);
    Logger.log(cards[0]);
}