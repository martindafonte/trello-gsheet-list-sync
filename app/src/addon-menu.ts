/// <reference path="./trello-client.ts" />


// ------------------------------------------------------------------------------------
// Adding menu options to spreadsheet:
// ------------------------------------------------------------------------------------
function onOpen() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var menuEntries = [{
        name: "Mostrar Tableros",
        functionName: "displayBoards"
    }, {
        name: "Mostrar listas del tablero",
        functionName: "displayLists"
    }, {
        name: "Crear hojas para las divisiones",
        functionName: "crearHojasParaDivisiones"
    }, {
        name: "Cargar fechas",
        functionName: "configurarInicialSheets"
    }, {
        name: "Cargar Niños",
        functionName: "sincronizarDivisiones"
    }, {
        name: "Actualizar listas",
        functionName: "trigger"
    }
     /*{
        name: "Register Webhook For Board",
        functionName: "registerWebhook"
    }, {
        name: "Delete Webhooks For Token",
        functionName: "deleteWebhooks"
    }*/];
    ss.addMenu("Villa", menuEntries);
    PropertiesService.getUserProperties().setProperty("ssId", ss.getId());
    var col = ss.getSheetByName("Config").getRange("B11:B11").getValues();
    PropertiesService.getUserProperties().setProperty("logPost", col[0][0].toString().trim());
}

function setupTrigger() {
    // Delete existing triggers:
    var triggers = ScriptApp.getProjectTriggers();
    for (var i in triggers) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

    // Create new trigger to run hourly.
    ScriptApp.newTrigger("addMissingThings").timeBased().everyHours(1).create();
    Browser.msgBox("Script successfully scheduled to run hourly.");
}

function displayBoards() {
    var values = listCurrentUserBoards();
    if (values.length == 0) return;
    let app = HtmlService.createHtmlOutput().setTitle("Available Boards");
    app.append("<table style=\"width:100%\"> <tr><th>Board Name</th>      <th>Board Id</th></tr>");
    for (var i = values.length - 1; i >= 0; i--) {
        app.append("<tr><td>" + values[i].name + "</td><td>" + values[i].id + "</td></tr>");
    }
    app.append("</table>");
    SpreadsheetApp.getActiveSpreadsheet().show(app);
    return;
}

function displayLists() {
    var values = listsForBoard(true);
    if (values.length == 0) return;
    let app = HtmlService.createHtmlOutput();
    app.append("<table style=\"width:100%\"> <tr><th>List Name</th>      <th>List Id</th></tr>");
    for (var i = values.length - 1; i >= 0; i--) {
        app.append("<tr><td>" + values[i].name + "</td><td>" + values[i].id + "</td></tr>");
    }
    app.append("</table>");
    app.setWidth(500).setHeight(500);
    app.setTitle("Available Lists");
    SpreadsheetApp.getActiveSpreadsheet().show(app);
    return;
}



