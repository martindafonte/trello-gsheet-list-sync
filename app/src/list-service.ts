/// <reference path="./style-utils.ts" />
//TODO Cambiar constantes por properties
var CTS = {
  defaultTemplate: "Template General",
  year: "2019",
  confighSheetName: "Config",
  ignorar: ["Archivo", "Templates"],
  cols: {
    nombre: 0, apellido: 1, barrio: 2, genero: 3, link: 4, id: 5, fechas: 6
  }
};

var VALORES_LISTA = ["X", "F", "J", "S"];


//-------------------
// Hojas por división
//-------------------
function crearHojasParaDivisiones() {
  var divisiones = obtenerDivisiones();
  divisiones.forEach(d => crearEncontrarSheet(d.name));
}

//-----------------------
// Encabezados con fechas
//-----------------------
function configurarInicialSheets() {
  var divisiones = obtenerDivisiones();
  divisiones.forEach(d => inicializarSheet(d));
}

function inicializarSheet(lista) {
  checkControlValues(true, true);
  var division = lista.name.toString();

  //Creo el sheet y aplico formato
  var sheet = crearEncontrarSheet(division);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  crearEncabezado(sheet);
  //Oculto la columna de id de trello
  sheet.hideColumns(CTS.cols.id + 1);

  //Cargo las fechas  
  var cantFechas = AgregarFechasHeader(sheet, division);
  var dateRange = sheet.getRange(2, CTS.cols.fechas + 1, 100, cantFechas);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(VALORES_LISTA, true).build();
  //Agregar formato condicional en base a los valores permitidos de asistencia
  dateRange.setDataValidation(rule);
}


function AgregarFechasHeader(sheet, division) {
  var fechas = obtenerFechasParaDivision(division);
  var sheet_range = sheet.getRange(1, CTS.cols.fechas + 1, 1, fechas.length * 2).getValues()[0];
  let fechas_name = fechas.map(x => x.nombre || '');
  let valores_sheet = sheet_range.map((x: any) => dateToString(x));
  var fechasCombinadas = combineOrderedArrays(valores_sheet, fechas_name);
  // var fechasCombinadas = fechasCombinadas.map(function (x) { return dateToString(x); });
  // var valoresSheet = valores_sheet.map(function (x) { if (x) return dateToString(x); });
  var indice_sheet = 0;
  //Agrego las columnas para los valores que se agregaron en el medio
  for (var i = 0; i < fechasCombinadas.length; i++) {
    if (valores_sheet[indice_sheet] == fechasCombinadas[i])
      indice_sheet++;
    else
      //Agrego una columna
      sheet.insertColumns(CTS.cols.fechas + 1 + i);
  }
  var dateRange = sheet.getRange(1, CTS.cols.fechas + 1, 1, fechasCombinadas.length);
  dateRange.setValues([fechasCombinadas]);
  aplicarFormatoHeaderFecha(dateRange);
  return fechasCombinadas.length;
}

/**
 * Retorna la lista de fechas que corresponden al template de la división
 * @param nombreLista Nombre de la lista en Trello
 */
function obtenerFechasParaDivision(nombreLista): Array<{ nombre: string, completada: boolean }> {
  var temp = obtenerTemplateParaLista(nombreLista);
  if (!temp || !temp.checklists || temp.checklists.length == 0) {
    return generarFechasAño(CTS.year);
  }
  var check = temp.checklists[0];
  var fechas = [];
  for (var i = 0; i < check.checkItems.length; i++) {
    fechas[i] = {
      nombre: check.checkItems[i].name,
      completada: check.checkItems[i].state == "complete",
    };
  }
  return fechas;
}

function obtenerTemplateParaLista(nombreLista) {
  var templates = getAvailableTemplates();
  if (templates && templates.length == 0)
    return null;
  else if (templates.length == 1 && templates[0].isForAllCards == true)
    return templates[0];
  else {
    for (var i = 0; i < templates.length; i++)
      if (nombreLista && templates[i].name.trim() === nombreLista.trim())
        return templates[i];
    var defecto = templates.filter(
      function (x) {
        return CTS.defaultTemplate.toLowerCase() == x.name.toLowerCase()
      });
    if (defecto && defecto.length > 0)
      return defecto[0];
  }
  return null;
}

function generarFechasAño(year_string) {
  let year = +year_string;
  var month = 2;//Marzo
  var day = 30;
  var now = new Date();
  var dates = [];
  var d = new Date(year, month, day);
  while (d.getMonth() < now.getMonth() || (d.getMonth() == now.getMonth() && d.getDate() <= now.getDate())) {
    dates.push({
      nombre: dateToString(d),
      completada: false
    }
    );
    d = new Date(year, month, day += 7);
  }
  return dates;
}


//----------------------------------
// Cargar niños a las divisiones
//----------------------------------
function sincronizarDivisiones() {
  var divisiones = obtenerDivisiones();
  divisiones.forEach(function (x) {
    sincronizarDivision(x);
  });
}

function obtenerDivisiones() {
  var cache = CacheService.getDocumentCache();
  var listasString = cache.get("listas");
  let listas = listasString ? JSON.parse(listasString) : [];
  if (!listas || listas.length == 0) {
    listas = listsForBoard(false);
    //Se queda con las que no están en la lista ignorar
    listas = listas.filter(function (x) { return CTS.ignorar.indexOf(x.name) === -1 });
    cache.put("listas", JSON.stringify(listas), 300);
  }
  return listas;
}


function sincronizarDivision(lista) {
  var division = lista.name.toString();
  var sheet = crearEncontrarSheet(division);
  var kids = cardsForList(lista, false).filter(function (x) { return x.name.indexOf("AA_") == -1 && x.name != division; });
  var sheet_values = sheet.getRange(2, 1, kids.length * 2, CTS.cols.id + 1).getValues();
  var sheet_id = sheet_values.map(function (x) { return x[CTS.cols.id]; }).filter(function (x) { return x; });
  var newKids = kids.filter(function (x) { return sheet_id.indexOf(x.id) == -1; });
  var newValues = [];
  var delete_index = [];
  for (var i = 0; i < sheet_id.length; i++) {
    var kid = kids.filter(function (x) { return x.id && x.id == sheet_id[i]; })[0];
    if (kid) {
      var name = splitName(kid.name);
      var labels = parseLabels(kid.labels);
      newValues[i] = [name.nombre, name.apellido, labels.barrio, labels.genero, kid.shortUrl, kid.id];
    } else {
      newValues[i] = sheet_values[i];
      delete_index.push(i);
    }
  }
  for (var i = 0; i < newKids.length; i++) {
    var kid = newKids[i];
    var name = splitName(kid.name);
    var labels = parseLabels(kid.labels);
    newValues[sheet_id.length + i] = [name.nombre, name.apellido, labels.barrio, labels.genero, kid.shortUrl, kid.id];
  }
  var newRange = sheet.getRange(2, 1, newValues.length, CTS.cols.id + 1);
  newRange.setValues(newValues);
  //Se borran los niños que no corresponden más
  delete_index.sort().reverse().forEach(function (x) {
    logPost("Se borra de la división " + division + ":" + sheet_values[x].join(","));
    sheet.deleteRow(2 + x);
  });
  aplicarFormatoKids(newRange);
}




//------------------------
// Cargar asistencias 
//------------------------

function sincronizarListas() {
  var divisiones = obtenerDivisiones();
  divisiones.forEach(
    function (div) {
      sincronizarLista(div);
    });
}

function sincronizarLista(division) {
  var sheet = crearEncontrarSheet(division.name);
  var fechasTemplate = obtenerFechasParaDivision(division.name);
  //tarjetas excepto divisiones y filtradas
  var tCards = cardsForList(division, true).filter(function (x) { return x.name.indexOf("AA_") == -1; });
  var range = sheet.getRange(1, 1, 100, 50);
  var kids = range.getValues();
  //Me quedo con las fechas
  var fechasHeader = kids[0].slice(CTS.cols.fechas).map((x: any) => dateToString(x));
  for (var row = 1; row < kids.length && kids[row][0]; row++) {
    var kid = kids[row];
    var tKid = tCards.filter(function (x) { return x.id == kid[CTS.cols.id]; })[0];
    if (!tKid)
      logPost("No existe el niño en : " + division.name + " " + kid);
    else {
      var lista = tKid.checklists.filter(function (x) { return x.name == CTS.year; })[0];
      if (!lista)
        continue;
      for (var col = CTS.cols.fechas; col < kid.length && kids[0][col]; col++) {
        var fechaTemplate = fechasTemplate.filter(x => compararFechasString(x.nombre, fechasHeader[col - CTS.cols.fechas]))[0];
        var newValue = fechaTemplate && fechaTemplate.completada ? 'S' : sincronizarFecha(kid, lista, kid[col], dateToString(kids[0][col]));
        if (newValue) {
          kids[row][col] = newValue;
          Logger.log("Fecha %s %s %s", kid[CTS.cols.nombre], dateToString(kids[0][col]), newValue);
        }
      }
    }
  }
  range.setValues(kids);
}

function sincronizarFecha(sheetRow, checkList, cellValue, date) {
  var checkItem = checkList.checkItems.filter(x => compararFechasString(x.name, date))[0];
  if (cellValue) {
    //var asistencia = cellValue == "X" ? true : false;
    /* COMENTADO PARA NO ACTUALIZAR TRELLO
    if(checkItem){
      if(checkItem.state == "complete" && !asistencia)
        addStateToCheckItem(sheetRow[CTS.cols.id], checkItem.id, false);
      else if(checkItem.state == "incomplete" && asistencia)
        addStateToCheckItem(sheetRow[CTS.cols.id], checkItem.id, true);
        
    }*/
    return cellValue;
  } else if (checkItem && checkItem.state == "complete") {
    return "X";
  }
}

function compararFechasString(f1, f2) {
  let s1 = dateToString(f1).toLowerCase();
  let s2 = dateToString(f2).toLowerCase();
  return s1.length > s2.length ? s1.indexOf(s2) >= 0 : s2.indexOf(s1) >= 0;
}

