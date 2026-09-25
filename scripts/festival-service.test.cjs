const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),Module=require('node:module');
const root=path.resolve(__dirname,'..');
const ts=require(path.join(root,'node_modules/typescript'));
let service=fs.readFileSync(path.join(root,'src/lib/festival-service.ts'),'utf8');
const compiled=ts.transpileModule(service,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let writes=[],deletes=[]; const chain={deleteTable:null,eq(field,value){if(this.deleteTable){deletes.push({table:this.deleteTable,field,value});this.deleteTable=null}return this},select(){return this},single:async()=>({error:null}),error:null}; const client={from(table){return {update(payload){writes.push({table,payload});return chain},insert(payload){writes.push({table,payload});return chain},delete(){chain.deleteTable=table;return chain}}}};
const m=new Module('festival-test');m.require=(name)=>name==='./supabase'?{createBrowserSupabaseClient:()=>client}:name==='./sample-data'?{sampleMenu:{items:[]}}:require(name);m._compile(compiled,'festival-test.cjs');
const {deleteFestival,orderedFestival,saveFestival}=m.exports;
(async()=>{
 const entries=[{id:'a',section:'ramen',status:'available',sort_order:20,price:10,product:{status:'hidden'}},{id:'b',section:'ramen',status:'out_of_stock',sort_order:10,price:300,product:{status:'available'}},{id:'c',section:'ramen',status:'hidden',sort_order:0,price:0}];
 assert.deepEqual(orderedFestival(entries,'ramen').map(x=>x.id),['b','a']);
 await saveFestival({...entries[0],menu_item_id:'product-id',is_new:true});
 assert.equal(writes[0].table,'festival_items');assert.deepEqual(Object.keys(writes[0].payload).sort(),['is_new','menu_item_id','price','section','sort_order','status']);
 assert.equal(writes[0].payload.is_new,true);
 await saveFestival({id:'',section:'combos',name:'Custom combo',price:240,status:'hidden',sort_order:1,is_new:true});assert.equal(writes[1].table,'festival_combos');assert.equal(writes[1].payload.is_new,true);
 await saveFestival({id:'combo-id',section:'combos',name:'Custom combo',price:240,status:'hidden',sort_order:1,is_new:false});assert.equal(writes[2].table,'festival_combos');assert.equal(writes[2].payload.is_new,false);
 await saveFestival({...entries[0],menu_item_id:'product-id',is_new:false});assert.equal(writes[3].table,'festival_items');assert.equal(writes[3].payload.is_new,false);
 await deleteFestival({id:'selection-id',section:'ramen'});assert.deepEqual(deletes[0],{table:'festival_items',field:'id',value:'selection-id'});
 await deleteFestival({id:'combo-id',section:'combos'});assert.deepEqual(deletes[1],{table:'festival_combos',field:'id',value:'combo-id'});
 await assert.rejects(()=>saveFestival({id:'',section:'ramen',price:-1,sort_order:1}));
 await assert.rejects(()=>saveFestival({id:'',section:'ramen',price:1,sort_order:1}));
 console.log('PASS: ordering, hidden exclusion, independent stock, item/combo NEW writes, festival-only deletion, validation');
})().catch(e=>{console.error(e);process.exitCode=1});

