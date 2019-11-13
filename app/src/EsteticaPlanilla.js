
function aplicarFormatoHeader(range){
  range.setBackground("#6d9eeb").setFontColor("#ffffff").setFontSize(12).setFontWeight("bold");
}

function aplicarFormatoHeaderFecha(range){
  range.setBackground("#6d9eeb").setFontColor("#ffffff").setFontSize(11).setFontWeight("normal");
}

function aplicarFormatoKids(range){
  range.setBackground("#fff2cc");
}


/**
* Crea el encabezado de un sheet para pasar la lista
*/
function crearEncabezado(sheet){
  var range = sheet.getRange(1, 1, 1, 6);
  aplicarFormatoHeader(range);
  var columns = [];
  columns[CTS.cols.nombre] = "Nombre";
  columns[CTS.cols.apellido] = "Apellido";
  columns[CTS.cols.barrio] = "Barrio";
  columns[CTS.cols.genero] = "Género";
  columns[CTS.cols.link] = "Card";
  columns[CTS.cols.id] = "TrelloId";
  range.setValues([columns]);
}