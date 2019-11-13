/**
* Funciones de Test
*/
function testDate() {
  //2 de enero
  Logger.log(dateToString(new Date(2017, 0, 2)));
  Logger.log(splitName("Martín Da Fonte"));
  Logger.log(splitName("Martín De la Fonte"));
  Logger.log(splitName("Martín"));
  Logger.log(splitName("Martín Ignacio Da Fonte"));
  Logger.log(splitName("Martín Ignacio Fonte Carrete"));
  Logger.log(parseLabels([{ name: "Varon" }, { name: "Km 19" }]));
}

function testCombineOrderedArrays() {
  var uno = [1, 2, 3, 5, 6, 10, 11];
  var dos = [1, 4, 5, 6, 7, 8, 9, 10];
  var salida = combineOrderedArrays(uno, dos);
  Logger.log(salida);
  var salida2 = combineOrderedArrays(salida, dos);
  Logger.log(salida2);
}
