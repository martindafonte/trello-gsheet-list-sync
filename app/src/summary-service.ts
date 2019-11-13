function crearResumen() {
  var date = '21-Apr-2018';
  crearResumenDeFecha(date);
}

function crearResumenDeFecha(date){
  var listas = obtenerDivisiones();
  listas.forEach(crearResumenParaLista, {date:date});
}

function crearResumenParaLista(lista){
  var date = this.date;
  var tarjetas = cardsForList(lista);
  var principal = tarjetas.filter(function(x){return lista.name == x.name});
  if(principal){
    principal = principal[0];
    var nombres = tarjetas.map(function(x){return x.name});
    var list_name = lista.name.toString();
    nombres = nombres.filter(function(x){ return x.toString().indexOf("AA_")== -1 ||  list_name == x.toString();});
    nombres = nombres.sort();
    var resp = addChecklist(principal, date);
    var id = JSON.parse(resp).id;
    if(id == null){
      throw new Error('falla');
    }
    nombres.forEach(function(x){
      addChecklistItem(id, x);
    });
    return 0;
  }
}
