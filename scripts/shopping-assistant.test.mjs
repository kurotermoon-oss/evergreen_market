import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCartOrderGroups} from '../src/utils/cartSupplierRules.js';
import {getShoppingTip, readGuideMode, saveGuideMode, GUIDE_SEEN_KEY, GUIDE_ACTIVE_KEY} from '../src/utils/shoppingAssistant.js';

const supplier=(id,minOrderAmount)=>({id,name:id,minOrderAmount,isActive:true});
const item=(id,owner,price,quantity=1)=>({id,name:id,price,quantity,fulfillmentType:'supplier_order',supplierId:owner.id,supplier:owner});

test('dismissal persists, active guidance is session-scoped, unrelated storage survives',()=>{
  const storage=()=>{const data=new Map([['evergreen_cart','keep']]);return {getItem:key=>data.get(key)??null,setItem:(key,val)=>data.set(key,val),removeItem:key=>data.delete(key)};};
  const browser={localStorage:storage(),sessionStorage:storage()};
  assert.equal(readGuideMode(browser),'new');
  saveGuideMode(browser,'closed');
  assert.equal(browser.localStorage.getItem(GUIDE_SEEN_KEY),'1');
  assert.equal(readGuideMode(browser),'closed');
  saveGuideMode(browser,'active');
  assert.equal(readGuideMode(browser),'active');
  assert.equal(readGuideMode({...browser,sessionStorage:storage()}),'closed');
  saveGuideMode(browser,'closed');
  assert.equal(browser.sessionStorage.getItem(GUIDE_ACTIVE_KEY),null);
  assert.equal(browser.localStorage.getItem('evergreen_cart'),'keep');
});

test('unavailable browser storage does not break shopping',()=>{
  const blocked={get localStorage(){throw new Error('blocked');},get sessionStorage(){throw new Error('blocked');}};
  assert.equal(readGuideMode(blocked),'new');
  assert.doesNotThrow(()=>saveGuideMode(blocked,'active'));
});

test('empty checkout returns to products without a checkout action',()=>{
  assert.equal(getShoppingTip({view:'checkout',groups:[]}).action.view,'catalog');
});

test('empty catalog explains filters instead of pointing at absent products',()=>{
  assert.equal(getShoppingTip({view:'catalog',catalogCount:0}).id,'catalog-empty');
  assert.equal(getShoppingTip({view:'catalog',catalogCount:0,cartCount:1}).action.view,'cart');
  assert.equal(getShoppingTip({view:'catalog',catalogCount:2}).id,'catalog');
});

test('minimum advice follows the selected supplier and never sums other groups',()=>{
  const groups=buildCartOrderGroups([item('A1',supplier('A',400),100),item('B1',supplier('B',200),150),{id:'stock',price:500,quantity:1,fulfillmentType:'in_stock'}]);
  const tip=getShoppingTip({view:'cart',groups,groupId:'supplier:B'});
  assert.equal(tip.id,'minimum');
  assert.match(tip.text,/50/);
  assert.equal(tip.action.supplierId,'B');
  assert.equal(tip.action.view,undefined);
  assert.match(tip.text,/Кожну групу/);
  assert.equal(getShoppingTip({view:'cart',groups,groupId:'in_stock'}).action.view,'checkout');
});

test('removed group falls back to current first group; minimum updates with quantity',()=>{
  const owner=supplier('A',400);
  const before=getShoppingTip({view:'cart',groups:buildCartOrderGroups([item('A1',owner,100)]),groupId:'removed'});
  const after=getShoppingTip({view:'cart',groups:buildCartOrderGroups([item('A1',owner,100,4)]),groupId:'supplier:A'});
  assert.equal(before.id,'minimum');
  assert.equal(after.action.view,'checkout');
  assert.equal(getShoppingTip({view:'checkout',groups:buildCartOrderGroups([item('A1',owner,100,4)])}).id,'details');
});

test('inactive supplier never receives an action to checkout',()=>{
  const owner={...supplier('A',0),isActive:false};
  assert.equal(getShoppingTip({view:'cart',groups:buildCartOrderGroups([item('A1',owner,100)])}).id,'blocked');
  assert.equal(getShoppingTip({view:'product',product:item('A1',owner,100)}).id,'unavailable');
});

test('unavailable product does not receive an invitation to add it',()=>{
  const product={...item('A1',supplier('A',400),100),stockStatus:'out_of_stock'};
  const tip=getShoppingTip({view:'product',product});
  assert.equal(tip.id,'unavailable');
  assert.equal(tip.action.view,'catalog');
});

test('supplier without minimum and stock without minimum get appropriate terms',()=>{
  assert.match(getShoppingTip({view:'product',product:item('A1',supplier('A',0),100)}).text,/немає мінімальної/);
  assert.match(getShoppingTip({view:'product',product:{id:'stock',fulfillmentType:'in_stock',stockQuantity:3}}).text,/без мінімуму/);
});

test('success needs confirmed completion; admin and login have no tutorial',()=>{
  assert.equal(getShoppingTip({view:'success'}).done,undefined);
  assert.equal(getShoppingTip({view:'success',completed:true}).done,true);
  assert.equal(getShoppingTip({view:'admin'}),null);
  assert.equal(getShoppingTip({view:'customer-auth'}),null);
});
