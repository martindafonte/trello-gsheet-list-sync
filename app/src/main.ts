/// <reference path="list-service.ts" />
/// <reference path="card-template-service.ts" />

function trigger() {
    checkControlValues(true, true);
    sincronizarDivisiones();
    sincronizarListas();
}

function pimpCardsNow() {
    addMissingThings();
    Browser.msgBox("Cards on board have been pimped!");
}