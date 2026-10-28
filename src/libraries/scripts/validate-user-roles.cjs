// Offline: real contracts, service, routes and navigation; in-memory DB/HTTP adapters.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const orm = require('drizzle-orm');
const pg = require('drizzle-orm/pg-core');
function load(file, modules, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name in modules ? modules[name] : require(name), console, Request, Response, URL, ...globals });
  return exports;
}


const roles=load('src/libraries/config/user-roles.ts',{});
assert.equal(roles.defaultAccountRole,'admin');
const authSchema=load('src/libraries/schema/auth/index.ts',{});
assert.equal(authSchema.User.role.default,'user'); // Existing DB declaration is not migrated.
const defaults=load('src/libraries/auth/account-defaults.ts',{'@/libraries/config/user-roles':roles});
let inserted;const source={createUser:value=>{inserted=value;return value;},getUser:()=>null};
const wrapped=defaults.withAccountDefaults(source);
wrapped.createUser({email:'example@test.invalid',role:'super_admin'});
assert.equal(inserted.role,'admin');
assert.equal(wrapped.getUser,source.getUser);
wrapped.createUser({email:'example@test.invalid'});assert.equal(inserted.role,'admin');
assert(roles.appRoleSchema.safeParse('admin').success);
assert(roles.appRoleSchema.safeParse('super_admin').success);
for(const role of ['user','Admin','superadmin','super_admin ',null,undefined])assert(!roles.appRoleSchema.safeParse(role).success);
assert(roles.auditedRoleSchema.safeParse('user').success);
for(const role of ['user','admin','super_admin',null,'unknown'])for(const isActive of [true,false,null])assert.equal(roles.isActiveSuperAdmin({role,isActive,isDeleted:false}),role==='super_admin'&&isActive===true);
assert.equal(roles.isActiveSuperAdmin(null),false);
assert.equal(roles.isActiveSuperAdmin(undefined),false);
console.log('PASS staged role contract: exact roles, ordinary Admin default, historical audit compatibility and active Super Admin predicate.');

assert.equal(roles.isActiveSuperAdmin({role:'super_admin',isActive:true,isDeleted:true}),false);
assert.equal(inserted.isDeleted,false);

assert.rejects(()=>wrapped.deleteUser('any'),/soft-delete/).catch(error=>{console.error(error);process.exitCode=1;});
