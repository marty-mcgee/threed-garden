// ==============================================================
// RESOURCES

import { AbilityBuilder, Ability } from '@casl/ability'

// ==============================================================
// FUNCTIONS
console.debug('🔑 acl config: loading...')

export const AppAbility = Ability

/**
 * Please define your own Ability rules according to your app requirements.
 * We have just shown Admin and Client rules for demo purpose where
 * admin can manage everything and client can just visit ACL page
 */
const defineRulesFor = (role, subject) => {
  const { can, rules } = new AbilityBuilder(AppAbility)
  // admin
  if (role === 'admin') {
    can('manage', 'all')
  }
  // client
  else if (role === 'client') {
    can(['read'], 'acl-page')
  }
  // role not defined/authorized ?? use subject ??
  else {
    // crud the subject
    can(['read', 'create', 'update', 'delete'], subject)
  }

  return rules
}

export const buildAbilityFor = (role, subject) => {
  return new AppAbility(defineRulesFor(role, subject), {
    // https://casl.js.org/v5/en/guide/subject-type-detection
    // @ts-ignore
    detectSubjectType: (object) => object.type,
  })
}

// default is 'admin' privileges !!!
export const defaultACLObj = {
  action: 'manage',
  subject: 'all',
}

export default defineRulesFor
