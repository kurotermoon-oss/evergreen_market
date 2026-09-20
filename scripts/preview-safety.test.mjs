import test from 'node:test';
import assert from 'node:assert/strict';
import { readonlyPreview } from './readonlyPreview.mjs';
import { supplyPreview } from './supplyPreview.mjs';
import { getRouteFromLocation, getPathForView, getProductPath } from '../src/utils/routes.js';

test('preview middleware stays disabled in normal development', () => {
  const saved=process.env.EG_READONLY_PREVIEW; delete process.env.EG_READONLY_PREVIEW;
  let registered=false;
  readonlyPreview().configureServer({middlewares:{use(){registered=true;}}});
  if(saved!==undefined)process.env.EG_READONLY_PREVIEW=saved;
  assert.equal(registered,false);
});

test('read-only preview rejects mutations before any data access', async () => {
  process.env.EG_READONLY_PREVIEW='1'; let middleware;
  readonlyPreview().configureServer({middlewares:{use(fn){middleware=fn;}}});
  for(const method of ['POST','PATCH','DELETE','PUT']){
    const response={statusCode:200,setHeader(){},end(body){this.body=JSON.parse(body);}};
    await middleware({url:'/api/orders',method},response,()=>assert.fail('Mutation reached proxy'));
    assert.equal(response.statusCode,403);
    assert.match(response.body.message,/не надсилаються/);
  }
  delete process.env.EG_READONLY_PREVIEW;
});
test('supply demo is opt-in and never intercepts real API requests', async () => {
  const saved = process.env.EG_READONLY_PREVIEW;
  try {
    delete process.env.EG_READONLY_PREVIEW;
    supplyPreview().configureServer({middlewares:{use(){assert.fail('Unexpected demo middleware');}}});
    process.env.EG_READONLY_PREVIEW='1'; let middleware;
    supplyPreview().configureServer({middlewares:{use(fn){middleware=fn;}}});
    let next = false;
    await middleware({url:'/api/telegram/supply/command',method:'POST'}, {}, () => { next = true; });
    assert.equal(next, true);
  } finally {
    if (saved === undefined) delete process.env.EG_READONLY_PREVIEW; else process.env.EG_READONLY_PREVIEW=saved;
  }
});

test('preview exposes only an unauthenticated session; admin data stays closed', async () => {
  process.env.EG_READONLY_PREVIEW='1'; let middleware;
  readonlyPreview().configureServer({middlewares:{use(fn){middleware=fn;}}});
  for(const [url,status] of [['/api/admin/me',200],['/api/customer/me',200],['/api/admin/orders',401]]){
    const response={statusCode:200,setHeader(){},end(body){this.body=JSON.parse(body);}};
    await middleware({url,method:'GET'},response,()=>assert.fail('Unexpected proxy call'));
    assert.equal(response.statusCode,status);assert.equal(response.body.authenticated,false);
  }
  delete process.env.EG_READONLY_PREVIEW;
});

test('existing routes survive and the draft route requires development mode', () => {
  for(const view of ['home','catalog','how-it-works','cart','checkout','contacts','account','admin']){
    assert.equal(getRouteFromLocation({pathname:getPathForView(view)}).view,view);
  }
  const productId='test / молоко';
  assert.equal(getRouteFromLocation({pathname:getProductPath(productId)}).productId,productId);
  for (const pathname of ['/preview/how-it-works','/preview/admin','/preview/account','/preview/success']) {
    assert.equal(getRouteFromLocation({pathname}).isNotFound,true);
  }
});
