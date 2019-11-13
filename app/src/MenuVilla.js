
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
    },{
      name: "Cargar fechas",
      functionName: "configurarInicialSheets"
    }, {
        name: "Cargar Niños",
        functionName: "sincronizarDivisiones"
    },{
      name: "Actualizar listas",
      functionName:"trigger"
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

    if (values.length == 0) {
        return;
    }

    var app = UiApp.createApplication();

    var header1 = app.createHTML("<b>Board Name</b>");
    var header2 = app.createHTML("<b>Board Id</b>");
    var grid = app.createGrid(values.length + 1, 2).setWidth("100%");
    grid.setBorderWidth(5);
    grid.setWidget(0, 0, header1).setWidget(0, 1, header2);
    grid.setCellPadding(5);

    for (var i = values.length - 1; i >= 0; i--) {
        grid.setText(i + 1, 0, values[i].name);
        grid.setText(i + 1, 1, values[i].id);
    }
    var panel = app.createScrollPanel(grid).setAlwaysShowScrollBars(true).setSize("100%", "100%");
    app.add(panel);
    app.setTitle("Available Boards");

    SpreadsheetApp.getActiveSpreadsheet().show(app);


    return;
}

function displayLists() {

    var values = listsForBoard(true);

    if (values.length == 0) {
        return;
    }

    var app = UiApp.createApplication();

    var header1 = app.createHTML("<b>List Name</b>");
    var header2 = app.createHTML("<b>List Id</b>");
    var grid = app.createGrid(values.length + 1, 2).setWidth("100%");
    grid.setBorderWidth(5);
    grid.setWidget(0, 0, header1).setWidget(0, 1, header2);
    grid.setCellPadding(5);

    for (var i = values.length - 1; i >= 0; i--) {
        grid.setText(i + 1, 0, values[i].name);
        grid.setText(i + 1, 1, values[i].id);
    }
    var panel = app.createScrollPanel(grid).setAlwaysShowScrollBars(true).setSize("100%", "100%");
    app.add(panel);
    app.setTitle("Available Lists");

    SpreadsheetApp.getActiveSpreadsheet().show(app);


    return;
}



