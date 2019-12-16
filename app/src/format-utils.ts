var months = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, ago: 7, set: 8, sep: 8, oct: 9, nov: 10, dec: 11, dic: 11,
  getMonthIndex: (x: string): number => this[(x || '').toLowerCase().slice(0, 3)]
};
var monthString = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var GENEROS = ["Varon", "Mujer"];
var BARRIOS = ["8 de Marzo", "Km 19", "Km 20", "Monarca", "Paso Hondo", "Los Zorzales"];
var APELL_ESP = ["da", "de", "del", "el", "la", "los"];


/*
* Funciones utiles
*/

function splitName(s) {
  var tokens = s.split(" ");
  if (tokens.length <= 2)
    return { nombre: tokens[0], apellido: tokens.slice(1).join(" ") };
  else if (tokens.length == 3) {
    if (esConector(tokens[1]))
      return { nombre: tokens[0], apellido: tokens.slice(1).join(" ") };
    else
      return { nombre: tokens.slice(0, 2).join(" "), apellido: tokens.slice(2).join(" ") };
  } else {
    if (esConector(tokens[1]))
      return { nombre: tokens[0], apellido: tokens.slice(1).join(" ") };
    else
      return { nombre: tokens.slice(0, 2).join(" "), apellido: tokens.slice(2).join(" ") };
  }
}

function esConector(token) {
  token = token.toLowerCase();
  return APELL_ESP.some(function (x) { return token == x; });
}

//Esto debería poder parametrizarse de alguna forma
function parseLabels(labels) {
  var resultado = { barrio: "", genero: "" };
  if (labels)
    for (var i = 0; i < labels.length; i++) {
      if (GENEROS.indexOf(labels[i].name.toString()) >= 0)
        resultado.genero = labels[i].name.toString();
      else if (BARRIOS.indexOf(labels[i].name.toString()) >= 0)
        resultado.barrio = labels[i].name.toString();
    }
  return resultado;
}


function parseDate(s: string) {
  var p = s.split('-');
  return new Date(+p[2], months.getMonthIndex(p[1]), +p[0], 0, 0, 0);
}

function dateToString(d): string {
  if (d && d instanceof Date)
    return d.getDate().toString() + "-" + monthString[d.getMonth()] + "-" + d.getFullYear().toString();
  return d.toString();
}

/**
 * Agrega los elementos de dos arreglos intentando mantener el orden del primero
 * @param arrayUno Arreglo principal
 * @param arrayDos Arreglo secundario, agregar al final del primero
 */
function combineOrderedArrays(arrayUno: Array<string>, arrayDos: Array<string>): Array<string> {
  var nuevoArreglo = [];
  var i_uno = 0;
  var i_nuevo = 0;
  for (let i_uno = 0; i_uno < arrayUno.length; i_uno++) {
    const element = arrayUno[i_uno];

  }
  for (var i_dos = 0; i_dos < arrayDos.length; i_dos++) {
    while (arrayUno[i_uno] && arrayUno[i_uno] < arrayDos[i_dos]) {
      nuevoArreglo[i_nuevo] = arrayUno[i_uno];
      i_uno++;
      i_nuevo++;
    }
    if (!arrayUno[i_uno]) {
      nuevoArreglo[i_nuevo] = arrayDos[i_dos];
      i_nuevo++;
    } else if (+arrayUno[i_uno] == +arrayDos[i_dos]) {
      nuevoArreglo[i_nuevo] = arrayDos[i_dos];
      i_uno++;
      i_nuevo++;
    } else { //es más grande
      //sheet.addColumn();
      nuevoArreglo[i_nuevo] = arrayDos[i_dos];
      i_nuevo++;
    }
  }
  if (i_uno < arrayUno.length)
    for (var i = i_uno; i < arrayUno.length && arrayUno[i]; i++) {
      nuevoArreglo[i_nuevo] = arrayUno[i_uno];
      i_nuevo++;
    }
  return nuevoArreglo;
}


function getQueryVariable(url, variable) {
  var query = url.split('?');
  if (query.length >= 2) {
    var vars = query[1].split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
        return decodeURIComponent(pair[1]);
      }
    }
  }
  return "";
}

function crearEncontrarSheet(name) {
  var ss = SpreadsheetApp.openById(PropertiesService.getUserProperties().getProperty("ssId"));
  var sheet = ss.getSheetByName(name);
  if (sheet == null) {
    sheet = ss.insertSheet(name, 0);
  }
  return sheet;
}


//------------------
// Unused:
//------------------

/**
 * Add a new row to log what happened
 * @param {*} data 
 */
function logPost(data) {
  var sheet = crearEncontrarSheet("Logging");
  sheet.appendRow([new Date(), data]);
}

function sendError(text) {
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), "Error Updating Cards On Board", "The following error occurred processing script to update cards on board: " + text);
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getCardNameWithoutPoints(name) {

  if (name.charAt(0) == "(" && name.indexOf(")") != -1) {
    return name.substr(name.indexOf(")") + 1).trim();
  }

  return name;

}