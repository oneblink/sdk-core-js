import { MiscTypes } from '@oneblink/types'

/**
 * Parse a User Profile based on a JWT payload. Will return `undefined` if not a
 * valid JWT payload
 *
 * #### Example
 *
 * ```js
 * import jwtDecode from 'jwt-decode'
 *
 * const jwtPayload = jwtDecode('a valid token from a user')
 * const userProfile = userService.parseUserProfile(jwtPayload)
 * if (userProfile) {
 *   // continue
 * }
 * ```
 *
 * @param data An object containing all parameters to be passed to the function
 */
export function parseUserProfile(
  data: unknown,
): MiscTypes.UserProfile | undefined {
  if (typeof data !== 'object' || !data) {
    return
  }
  const jwtPayload = data as Record<string, unknown>
  if (typeof jwtPayload.sub !== 'string') {
    return
  }
  const userProfile: MiscTypes.UserProfile = {
    isSAMLUser: false,
    providerType: 'Cognito',
    providerUserId: jwtPayload.sub,
    userId: jwtPayload.sub,
    email: typeof jwtPayload.email === 'string' ? jwtPayload.email : undefined,
    emailVerified:
      typeof jwtPayload.email_verified === 'boolean'
        ? jwtPayload.email_verified
        : undefined,
    firstName:
      typeof jwtPayload.given_name === 'string'
        ? jwtPayload.given_name
        : undefined,
    middleName:
      typeof jwtPayload.middle_name === 'string'
        ? jwtPayload.middle_name
        : undefined,
    lastName:
      typeof jwtPayload.family_name === 'string'
        ? jwtPayload.family_name
        : undefined,
    fullName: typeof jwtPayload.name === 'string' ? jwtPayload.name : undefined,
    picture:
      typeof jwtPayload.picture === 'string' ? jwtPayload.picture : undefined,
    address:
      typeof jwtPayload.address === 'string' ? jwtPayload.address : undefined,
    role:
      typeof jwtPayload['custom:role'] === 'string'
        ? jwtPayload['custom:role']
        : undefined,
    username:
      typeof jwtPayload.email === 'string' ? jwtPayload.email : jwtPayload.sub,
    supervisor: {
      fullName:
        typeof jwtPayload['custom:supervisor_name'] === 'string'
          ? jwtPayload['custom:supervisor_name']
          : undefined,
      email:
        typeof jwtPayload['custom:supervisor_email'] === 'string'
          ? jwtPayload['custom:supervisor_email']
          : undefined,
      providerUserId:
        typeof jwtPayload['custom:supervisor_user_id'] === 'string'
          ? jwtPayload['custom:supervisor_user_id']
          : undefined,
    },
    phoneNumber:
      typeof jwtPayload['custom:phone_number'] === 'string'
        ? jwtPayload['custom:phone_number']
        : undefined,
    phoneNumberVerified:
      typeof jwtPayload['custom:phone_number_verified'] === 'boolean'
        ? jwtPayload['custom:phone_number_verified']
        : undefined,
    groups:
      typeof jwtPayload['custom:groups'] === 'string'
        ? jwtPayload['custom:groups'].split(',').map((group) => group.trim())
        : undefined,
    areaCode:
      typeof jwtPayload['custom:area_code'] === 'string'
        ? jwtPayload['custom:area_code']
        : undefined,
    city:
      typeof jwtPayload['custom:city'] === 'string'
        ? jwtPayload['custom:city']
        : undefined,
    state:
      typeof jwtPayload['custom:state'] === 'string'
        ? jwtPayload['custom:state']
        : undefined,
    country:
      typeof jwtPayload['custom:country'] === 'string'
        ? jwtPayload['custom:country']
        : undefined,
    countryCallingCode:
      typeof jwtPayload['custom:country_calling_code'] === 'string'
        ? jwtPayload['custom:country_calling_code']
        : undefined,
    department:
      typeof jwtPayload['custom:department'] === 'string'
        ? jwtPayload['custom:department']
        : undefined,
    bargain:
      typeof jwtPayload['custom:bargain'] === 'string'
        ? jwtPayload['custom:bargain']
        : undefined,
    employeeNumber:
      typeof jwtPayload['custom:employee_number'] === 'string'
        ? jwtPayload['custom:employee_number']
        : undefined,
    departmentHeadFullName:
      typeof jwtPayload['custom:department_head_full_name'] === 'string'
        ? jwtPayload['custom:department_head_full_name']
        : undefined,
    departmentHeadEmail:
      typeof jwtPayload['custom:department_head_email'] === 'string'
        ? jwtPayload['custom:department_head_email']
        : undefined,
  }

  if (
    !userProfile.supervisor?.fullName &&
    !userProfile.supervisor?.email &&
    !userProfile.supervisor?.providerUserId
  ) {
    userProfile.supervisor = undefined
  }

  if (
    jwtPayload.identities &&
    Array.isArray(jwtPayload.identities) &&
    jwtPayload.identities.length
  ) {
    const { providerType, userId } = jwtPayload.identities[0]
    userProfile.providerType = providerType
    userProfile.providerUserId = userId
    userProfile.isSAMLUser = providerType === 'SAML'
    if (userProfile.isSAMLUser) {
      userProfile.username = jwtPayload.preferred_username || userId
    }
  }

  return userProfile
}

/**
 * A friendly `string` that represents the a [User Profile](#user-profile). Uses
 * first name, last name, full name, email address or username.
 *
 * #### Example
 *
 * ```js
 * const userProfile = userService.parseUserProfile(jwtPayload)
 * const name = userService.getUserFriendlyName(userProfile)
 * if (name) {
 *   // Display current user's name
 * }
 * ```
 *
 * @param userProfile
 * @returns
 */
export function getUserFriendlyName(
  userProfile: MiscTypes.UserProfile,
): string {
  if (userProfile.fullName) {
    return userProfile.fullName
  }

  if (userProfile.firstName || userProfile.lastName) {
    return [userProfile.firstName, userProfile.lastName].join(' ').trim()
  }

  if (userProfile.email) {
    return userProfile.email
  }

  if (userProfile.username) {
    return userProfile.username
  }

  return userProfile.userId
}
