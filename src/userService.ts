import { MiscTypes } from '@oneblink/types'

function parseBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function parseString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function parseAddress(address: unknown): string | undefined {
  if (typeof address === 'object' && address && 'formatted' in address) {
    return parseString(address.formatted)
  }

  return parseString(address)
}

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
    email: parseString(jwtPayload.email),
    emailVerified: parseBoolean(jwtPayload.email_verified),
    firstName: parseString(jwtPayload.given_name),
    middleName: parseString(jwtPayload.middle_name),
    lastName: parseString(jwtPayload.family_name),
    fullName: parseString(jwtPayload.name),
    picture: parseString(jwtPayload.picture),
    address: parseAddress(jwtPayload.address),
    role: parseString(jwtPayload['custom:role']),
    username: parseString(jwtPayload.email) || jwtPayload.sub,
    supervisor: {
      fullName: parseString(jwtPayload['custom:supervisor_name']),
      email: parseString(jwtPayload['custom:supervisor_email']),
      providerUserId: parseString(jwtPayload['custom:supervisor_user_id']),
    },
    phoneNumber: parseString(jwtPayload['custom:phone_number']),
    phoneNumberVerified: parseBoolean(
      jwtPayload['custom:phone_number_verified'],
    ),
    groups: parseString(jwtPayload['custom:groups'])
      ?.split(',')
      .map((group) => group.trim()),
    areaCode: parseString(jwtPayload['custom:area_code']),
    city: parseString(jwtPayload['custom:city']),
    state: parseString(jwtPayload['custom:state']),
    country: parseString(jwtPayload['custom:country']),
    countryCallingCode: parseString(jwtPayload['custom:country_calling_code']),
    department: parseString(jwtPayload['custom:department']),
    division: parseString(jwtPayload['custom:division']),
    bargain: parseString(jwtPayload['custom:bargain']),
    employeeNumber: parseString(jwtPayload['custom:employee_number']),
    departmentHeadFullName: parseString(
      jwtPayload['custom:departmenthead_name'],
    ),
    departmentHeadEmail: parseString(jwtPayload['custom:departmenthead_email']),
    zipCode: parseString(jwtPayload['custom:zip_code']),
    postalCode: parseString(jwtPayload['custom:postal_code']),
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
