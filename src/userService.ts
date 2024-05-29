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
    lastName:
      typeof jwtPayload.family_name === 'string'
        ? jwtPayload.family_name
        : undefined,
    fullName: typeof jwtPayload.name === 'string' ? jwtPayload.name : undefined,
    picture:
      typeof jwtPayload.picture === 'string' ? jwtPayload.picture : undefined,
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
        ? jwtPayload['custom:groups'].split(',')
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
