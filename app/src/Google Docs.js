
function isGDoc(attachment) {
  
  if (attachment.url.toUpperCase().indexOf("HTTPS://DOCS.GOOGLE.COM") >-1) {
    return true;  
  }  
    
  return false;
    
}  

function getAttachedGoogleDocs(card) {
  
  var docs = new Array();

  for (var j=0; card.attachments && j<card.attachments.length;j++) {
    
    if (isGDoc(card.attachments[j])) {
        docs.push(getGoogleDoc(card.attachments[j]));
    }   

  }    
  
  return docs;
  
}

function getGoogleDoc(attachment) {
  
  var id = getQueryVariable(attachment.url,"id");
  if (id == "") {
    var index = attachment.url.toUpperCase().indexOf("/D/");
    if (index > 0) {
      id = attachment.url.substring(index+3).split("/")[0];
    }  
  } 
  if (id == "") {
     id = getQueryVariable(attachment.url,"key");
  }  
  var doc = new Object();
  doc.name = attachment.name;
  
 
  try {
    doc.file = DriveApp.getFileById(id);
 } catch(e) {
   // Shouldn't need to do anything
 }
  
  return doc;
  
}  

function checkForGoogleDoc(card,doc,createDoc) {
  
  var gDocFound = false;
  
  // If a Google Doc is required, then see if one is already attached:
  if (doc.name != "") {
  
    for (var j=0; j < card.attachments.length && gDocFound == false; j++) {
     
      if (isMatchingGDoc(card,card.attachments[j],doc.name)) {
        renameGDoc(card,doc,card.attachments[j]);
        gDocFound = true;
      }    
   
    }
    
    if (gDocFound  == false && createDoc == "Y") {
      createGDoc(card,doc);    
    }    
  
  }  
  
  
}

function getGDocSuffix(card) {
  
  return " #" + card.idShort.toFixed(0);
  
}  

function isMatchingGDoc(card,attachment,name) {
  
  if (attachment.url.toUpperCase().indexOf("HTTPS://DOCS.GOOGLE.COM") >-1 
      && (attachment.name.toUpperCase().indexOf(name.toUpperCase() + getGDocSuffix(card)) == 0)
      && isAuthorisedToDoc(attachment.url)
  ) {
 
    return true;  
  }  
    
  return false;
    
} 

function isAuthorisedToDoc(url) {
  var id = getQueryVariable(url,"id");
  if (id == "") {
    var index = url.toUpperCase().indexOf("/D/");
    if (index > 0) {
      id = url.substring(index+3).split("/")[0];
    }  
  } 
  if (id == "") {
     id = getQueryVariable(url,"key");
  }  
  
 
  try {
    var file = DriveApp.getFileById(id);
 } catch(e) {
   return false;
 }
  
  return true;
}

function createGDoc(card,doc) {

  var file = doc.file.makeCopy(doc.name.trim() + getGDocSuffix(card));
  var templateFolders = doc.file.getParents(); 
  var newFolders = file.getParents();
  
  addGoogleDocToCard(card,file)
  
  for (var i= 0; i < templateFolders.length; i++) {
    file.addToFolder(templateFolders[i]);
  }  
  
  for (var i= 0; i < newFolders.length; i++) {
    var removeFolder = true;
    
    for (var j=0;j < templateFolders.length;j++) {
      if (newFolders[i].getId() == templateFolders[j].getId()) {
        removeFolder = false;
      }  
    }     
    if (removeFolder == true) {
      file.removeFromFolder(newFolders[i]);
    }
    
    // Rename the Google Doc to have the card description in the name:
    file.rename(getGDocName(card,doc));
    
  }  
  
  
  
}  

function renameGDoc(card,templateDoc,attachment) {

  var docName = getGDocName(card,templateDoc);
  var doc = getGoogleDoc(attachment);
  
  
  if (doc.file && doc.file.getName().toUpperCase() != docName.toUpperCase()) {
    doc.file.setName(docName);
  }  
  
  
} 

function getGDocName(card,templateDoc) {
  
   return templateDoc.name.trim() + getGDocSuffix(card) + " - " + getCardNameWithoutPoints(getNameWithoutCost(card.name));

  
}  

function addGoogleDocToCard(card,file) {
  
  var url = constructTrelloURL("cards/" + card.id + "/attachments") + "&url=" + encodeURIComponent(file.getUrl()) + "&name=" + encodeURIComponent(file.getName());
  var resp = UrlFetchApp.fetch(url, {"method": "post"});
  return JSON.parse(resp.getContentText());
  
}  
    
function createDocumentInFolder(fileName, folderid) {

    var doc = DocumentApp.create(fileName);
    if (folderid != "") {
        var id = doc.getId();
        DriveApp.getFolderById(folderid).addFile(id);
    }

    return doc;

}
