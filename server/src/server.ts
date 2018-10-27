/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments,
	 InitializeResult, TextDocumentPositionParams,Diagnostic,DiagnosticSeverity,
	Location,Range,TextDocument,Position,Definition,CompletionItem,CompletionItemKind,
} from 'vscode-languageserver';
;

import JceCheck from "./jce_check"

let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
let documents: TextDocuments = new TextDocuments();
documents.listen(connection);

connection.onInitialize((_params): InitializeResult => {
	documents.all().forEach(analysisDocumentDef)
	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			definitionProvider:true,
			completionProvider: {
				resolveProvider: true
			},
		}
	}
});
let checkGrammar:boolean = true
function checkJceFile(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	if(checkGrammar){
		try{
			JceCheck(textDocument.getText())
		}catch(e){
			let diagnosic: Diagnostic = {
				severity: DiagnosticSeverity.Error,
				range: {
					start: { line: e.token.startLine, character: e.token.startCol },
					end: { line: e.token.endLine, character: e.token.endCol}
				},
				message: e.msg,
				source: 'ex'
			};
			diagnosic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: {
							start: { line: e.token.startLine, character: e.token.startCol },
							end: { line: e.token.endLine, character: e.token.endCol }
						}
					},
					message:e.msg
				}
			];
			diagnostics.push(diagnosic);	
		}	
	}	
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}
	


documents.onDidChangeContent((change) => {
	analysisDocumentDef(change.document)
	checkJceFile(change.document)
});

interface Settings {
	jce: JcePluginSetting;
}
interface JcePluginSetting {
	check_grammar: boolean;
}

connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	checkGrammar = settings.jce.check_grammar
	documents.all().forEach(analysisDocumentDef);
	documents.all().forEach(checkJceFile);
});

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

	//type declare info 
	interface FileDefInfo{
		includeFile:Array<string>;
		uri:string;
		defMap:Map<string,Range>;
	}
	
	var createFileDefInfo = function (){
	return {
		includeFile:new Array<string>(),
		uri:"",
		defMap:new Map<string,Range>()
	}
	};
	
	let fileName2UriSet :Map<string,Set<string> > = new Map<string,Set<string> >();
	let fileUri2FileDef :Map<string,FileDefInfo> = new Map<string,FileDefInfo>();
	
	var getTypeName = function(line:string,pos:number):string{
		let start:number = pos - 1
		let end:number = pos
		while(start >= 0 && 
			  ((line[start] >= 'a' && line[start] <= 'z' )||
			   (line[start] >= 'A' && line[start] <= 'Z' )||
			   (line[start] >= '0' && line[start] <= '9') ||
			   (line[start] == '_'))){
				   start = start - 1;
			   }
		while(end < line.length && 
				((line[end] >= 'a' && line[end] <= 'z' )||
				 (line[end] >= 'A' && line[end] <= 'Z' )||
				 (line[end] >= '0' && line[end] <= '9') ||
				 (line[end] == '_'))){
					 end = end + 1;
				 }
		if(start == end){
			return ""
		}
		return line.substr(start + 1, end - start -1)
	};

var analysisDocumentDef = function (textDocument: TextDocument):void {	
	let fileDefInfo :FileDefInfo = createFileDefInfo()
	fileDefInfo.uri = textDocument.uri
	let lines = textDocument.getText().split(/\r?\n/g);
	for (var i = 0 ; i < lines.length; i++){
		let line = lines[i];		
		if (line.indexOf("#include") >= 0 ){
			var jceFileReg = /([\/a-zA-Z0-9_]+\.jce)/gi
			var match = jceFileReg.exec(line);
			if(match){
				var fileFullName = match[1];
				var vec = fileFullName.split('/');
				var fileName = vec[vec.length -1];
				fileDefInfo.includeFile.push(fileName)
			}
		}
		else if (line.indexOf("struct") >= 0){
			var structReg = /\s+struct\s+([a-zA-Z0-9_]+)/gi
			var match = structReg.exec(line);
			if(match){
				let typeName:string = match[1];
				var startPos = line.indexOf(typeName)
				let range:Range = Range.create(i,startPos,i, typeName.length + startPos);
				fileDefInfo.defMap.set(typeName,range)
				
			}
		}
		else if (line.indexOf("enum") >= 0){
			var structReg = /\s+enum\s+([a-zA-Z0-9_]+)/gi
			var match = structReg.exec(line);
			if(match){
				let typeName:string = match[1];
				var startPos = line.indexOf(typeName)
				let range:Range = Range.create(i,startPos,i, typeName.length + startPos);
				fileDefInfo.defMap.set(typeName,range)
				
			}			
		}
	}
	{
		let currFileName :string = textDocument.uri.substr(textDocument.uri.lastIndexOf('/')+1)
		let uriSet:Set<string> = fileName2UriSet.get(currFileName)
		if(!uriSet){
			uriSet = new Set<string>()
		}
		uriSet.add(textDocument.uri)
		fileName2UriSet.set(currFileName,uriSet)
		fileUri2FileDef.set(textDocument.uri,fileDefInfo)
	}
	
};


connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	//get part name
	let currUri:string = _textDocumentPosition.textDocument.uri
	let currPos:Position = _textDocumentPosition.position
	let currLine:string = documents.get(currUri).getText(Range.create(currPos.line,0,currPos.line+1,0))
	let partName:string = getTypeName(currLine,currPos.character)
	let retCompleVec:CompletionItem[] = []
	let fileSet:Set<string> = getAllDepFileSet(currUri)
	fileSet.forEach(
		function(uri:string):void{
			let fileDefInfo:FileDefInfo =  fileUri2FileDef.get(uri);
			fileDefInfo.defMap.forEach(
				function(value:Range,key:string,_map:Map<string,Range>) :void{
					if(key.startsWith(partName)){
						let fileName:string = uri.substr(uri.lastIndexOf('/')+1)
						let context:string = fileName + '\tL'+ (value.start.line + 1) +',C' + 
											 (value.start.character + 1)  + '\n' + 
											 documents.get(fileDefInfo.uri).getText(Range.create(value.start.line ,0,value.start.line+6,0 ))
						let item:CompletionItem= {
							label:key,
							kind:CompletionItemKind.Struct,		 
							documentation: context,
						}						
						retCompleVec.push(item)
					}
				}
			);
		}
	);
	return retCompleVec
});


connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	return item;
});

function getAllDepFileSet(uri:string):Set<string>{
	let fileSet:Set<string> = new Set<string>()
	fileSet.add(uri)
	var analysisDepFile = function(uri:string):void{
		fileSet.add(uri)
		let fileDefInfo:FileDefInfo =  fileUri2FileDef.get(uri);
		for( var i = 0; i < fileDefInfo.includeFile.length; i = i+1){
			var fileName = fileDefInfo.includeFile[i]
			let fSet:Set<string> = fileName2UriSet.get(fileName)
			if(fSet){
				fSet.forEach(
					function(e){
						fileSet.add(e)
						analysisDepFile(e)
					}
				);
			} 
		}
	};
	analysisDepFile(uri)
	return fileSet
}
connection.onDefinition((param:TextDocumentPositionParams): Definition | undefined | null=>{	
	let currUri:string = param.textDocument.uri;
	analysisDocumentDef(documents.get(currUri))
	let fileSet:Set<string> = getAllDepFileSet(currUri)
	let defVec:	Location[] = [];
	fileSet.forEach(
		function(uri){
			let fileDefInfo:FileDefInfo =  fileUri2FileDef.get(uri);
			let startPos:Position = param.position;
			let typeNameLine:string = documents.get(currUri).getText(Range.create(startPos.line,0,startPos.line+1,0))
			let typeName:string = getTypeName(typeNameLine,param.position.character)	
			if(typeName != ""){	
				let defPos:Range = fileDefInfo.defMap.get(typeName);
				if(defPos){
					defVec.push({
						uri:fileDefInfo.uri,
						range:defPos
					})
				}
			} 
		}
		
	);
    if(defVec.length == 0){
		return null
	}
	else if(defVec.length == 1){
		return defVec[0]
	}
	return defVec
});
connection.listen();
