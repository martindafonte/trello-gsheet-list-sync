//TODO Cambiar constantes por properties
var CTS = {
  defaultTemplate : "Template General",
  year:"2019",
  confighSheetName: "Config",
  ignorar : ["Archivo","Templates"],
  cols:{
  nombre:0, apellido:1, barrio:2, genero:3, link:4 ,id:5,fechas:6
  }
};

var VALORES_LISTA = ["X", "F", "J","S"];



function prueba(){
  Logger.log(CTS.fechas);
  //checkControlValues(true, true);
  //sincronizarListas();
  //var divisiones = obtenerDivisiones();
  //sincronizarLista(divisiones[0]);
  /*divisiones.forEach(function(x){
    if(x.name.toString() == "Focas")
      sincronizarDivision(x);
  });*/
  //https://developers.google.com/apps-script/reference/base/browser#inputBox(String)
  // Display a sidebar with custom UiApp content.
  //var numero = Browser.inputBox("Ingrese un número");
  //Logger.log(numero);
}

function trigger(){
  checkControlValues(true, true);
  sincronizarDivisiones();
  sincronizarListas();
}

function crearHojasParaDivisiones(){
  var divisiones = obtenerDivisiones();
  divisiones.forEach( 
    function(div){
      Logger.log(div.name);
      crearSheet(div.name.toString());
    });
}

function configurarInicialSheets(){
  var divisiones = obtenerDivisiones();
  divisiones.forEach( 
    function(div){
      inicializarSheet(div);      
    });
}

function inicializarSheet(lista){
  checkControlValues(true, true);
  var division = lista.name.toString();
  var sheet = crearSheet(division);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  crearEncabezado(sheet);
  //Oculto la columna de id de trello
  sheet.hideColumns(CTS.cols.id + 1);
  var cantFechas = AgregarFechasHeader(sheet, division);
  var dateRange = sheet.getRange(2,CTS.cols.fechas + 1, 100, cantFechas);
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(VALORES_LISTA, true).build();
  dateRange.setDataValidation(rule);
  //Agregar formato condicional en base a los valores
}


function AgregarFechasHeader(sheet, division){
 var fechas = obtenerFechasParaDivision(division);
 var valores = sheet.getRange(1, CTS.cols.fechas + 1, 1, fechas.length * 2).getValues()[0];
  fechas = fechas.map(function(x){
    if(x.nombre) return x.nombre;
  });
  valores = valores.map(function(x){
    if(x){
      if(x instanceof Date) return x;
      else return parseDate(x);
    }
  });
  var fechasCombinadas =  combineOrderedArrays(valores, fechas);
  var fechasCombinadas = fechasCombinadas.map(function(x){ return dateToString(x);});
  var valoresSheet = valores.map(function(x){ if(x)return dateToString(x);});
  var indice_sheet =0;
  //Agrego las columnas para los valores que se agregaron en el medio
  for(var i = 0; i < fechasCombinadas.length; i++){
    if(valoresSheet[indice_sheet] == fechasCombinadas[i])
      indice_sheet++;
    else
      //Agrego una columna
      sheet.insertColumns(CTS.cols.fechas + 1 + i);
  }
  var dateRange = sheet.getRange(1, CTS.cols.fechas +1, 1, fechasCombinadas.length);
  dateRange.setValues([fechasCombinadas]);
  aplicarFormatoHeaderFecha(dateRange);
  return fechasCombinadas.length;
}

function sincronizarDivisiones(){
  var divisiones = obtenerDivisiones();
  divisiones.forEach(function(x){
    sincronizarDivision(x);
  });
}

function sincronizarDivision(lista){
  var division = lista.name.toString();
  var sheet = crearSheet(division);
  var kids = cardsForList(lista, false).filter(function(x){ return x.name.indexOf("AA_")== -1 && x.name != division;});
  var sheet_values = sheet.getRange(2, 1, kids.length *2, CTS.cols.id + 1).getValues();
  var sheet_id = sheet_values.map(function(x){return x[CTS.cols.id];} ).filter(function(x){ return x;});
  var newKids = kids.filter(function(x){ return sheet_id.indexOf(x.id) == -1;});
  var newValues = [];
  var delete_index = [];
  for(var i = 0; i < sheet_id.length; i++){
    var kid = kids.filter(function(x){ return x.id && x.id == sheet_id[i];})[0];
    if(kid){
      var name = splitName(kid.name);
      var labels = parseLabels(kid.labels);
      newValues[i] = [name.nombre, name.apellido, labels.barrio, labels.genero, kid.shortUrl, kid.id];
    }else{
      newValues[i] = sheet_values[i];    
      delete_index.push(i);
    }
  }
  for(var i = 0; i < newKids.length; i++){
    var kid = newKids[i];
    var name = splitName(kid.name);
    var labels = parseLabels(kid.labels);
    newValues[sheet_id.length+i] = [name.nombre, name.apellido, labels.barrio, labels.genero, kid.shortUrl, kid.id];
  }
  var newRange = sheet.getRange(2, 1, newValues.length, CTS.cols.id + 1);
  newRange.setValues(newValues);  
  //Se borran los niños que no corresponden más
  delete_index.sort().reverse().forEach(function(x){
    logPost("Se borra de la división "+division+":"+sheet_values[x].join(",")); 
    sheet.deleteRow(2+x);
  });
  aplicarFormatoKids(newRange);
}



function obtenerDivisiones(){
  var cache = CacheService.getDocumentCache();
  var listas = cache.get("listas");
  if(listas){
    listas = JSON.parse(listas);
  }else{
    listas = listsForBoard(false);
    //Se queda con las que no están en la lista ignorar
    listas = listas.filter(function(x){ return CTS.ignorar.indexOf(x.name) === -1});
    cache.put("listas", JSON.stringify(listas), 300);
  }
  return listas;
}

function obtenerFechasParaDivision(nombreLista){
  var temp = obtenerTemplateParaLista(nombreLista);
  if(!temp || !temp.checklists || temp.checklists.length == 0){
    return cargarFechasAnio(CTS.year);
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

function obtenerTemplateParaLista(nombreLista){
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
      function(x){
        return CTS.defaultTemplate.toLowerCase() == x.name.toLowerCase()
      });
    if (defecto && defecto.length > 0)
      return defecto[0];
  }
  return null;
}


function sincronizarListas(){
  var divisiones = obtenerDivisiones();
  divisiones.forEach( 
    function(div){
      sincronizarLista(div);      
    });
}

function sincronizarLista(division){
  var sheet = crearSheet(division.name);
  var fechasTemplate = obtenerFechasParaDivision(division.name);
  var tCards = cardsForList(division, true).filter(function(x){ return x.name.indexOf("AA_")== -1;});
  var range =sheet.getRange(1,1,100, 50); 
  var kids = range.getValues();
  var fechasHeader = kids[0].slice(CTS.cols.fechas).map(function(x){if(x) return dateToString(x);});
  for(var i =1; i< kids.length && kids[i][0]; i++){
    var kid =kids[i];
    var tKid = tCards.filter(function(x){return x.id == kid[CTS.cols.id];})[0];
    if(!tKid)
      logPost("No existe el niño en : "+division.name+" "+kid); 
    else{
      var lista = tKid.checklists.filter(function(x) { return x.name == CTS.year;})[0];
      if(lista)
        for(var f =CTS.cols.fechas; f< kid.length && kids[0][f]; f++)
        { 
          var fechaTemplate = fechasTemplate.filter(function(x){return x.nombre == fechasHeader[f - CTS.cols.fechas];});
          if(fechaTemplate && fechaTemplate.length > 0 && fechaTemplate[0].completada)
            kid[f] = 'S';
          else{
            var newValue = sincronizarFecha(kid, lista, kid[f], dateToString(kids[0][f]));          
            if(newValue){
              kids[i][f] = newValue;
            }
          }
        }
    }
  }
  range.setValues(kids);
}

function sincronizarFecha(sheetRow, checkList, cellValue, date){
  var checkItem = checkList.checkItems.filter(function(x) { return x.name == date;})[0];
  if(cellValue){
    var asistencia = cellValue == "X"? true : false;
    /* COMENTADO PARA NO ACTUALIZAR TRELLO
    if(checkItem){
      if(checkItem.state == "complete" && !asistencia)
        addStateToCheckItem(sheetRow[CTS.cols.id], checkItem.id, false);
      else if(checkItem.state == "incomplete" && asistencia)
        addStateToCheckItem(sheetRow[CTS.cols.id], checkItem.id, true);
        
    }*/
    return cellValue;
  }else{
    if(checkItem && checkItem.state == "complete"){
        return "X";
    }
  }
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

function cargarFechasAnio(year){
  year = +year;
  var month = 02;//Marzo
  var day = 30; 
  var now = new Date();
  var dates = [];
  var d = new Date(year, month, day);
  while(d.getMonth() < now.getMonth() || (d.getMonth() == now.getMonth() && d.getDate() <= now.getDate())){
       dates.push({
         nombre:dateToString(d),
         completada: false}
                 );
          d = new Date(year, month, day +=7);
    }
  return dates;
}