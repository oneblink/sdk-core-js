import { MiscTypes } from '@oneblink/types'
import { parseUserProfile, getUserFriendlyName } from '../src/userService'

describe('parseUserProfile', () => {
  it('should return undefined for non-object input', () => {
    expect(parseUserProfile(null)).toBeUndefined()
    expect(parseUserProfile(undefined)).toBeUndefined()
    expect(parseUserProfile('string')).toBeUndefined()
    expect(parseUserProfile(123)).toBeUndefined()
  })

  it('should return undefined if sub is missing or not a string', () => {
    expect(parseUserProfile({})).toBeUndefined()
    expect(parseUserProfile({ sub: 123 })).toBeUndefined()
  })

  it('should parse basic valid JWT payload', () => {
    const payload = {
      sub: 'abc123',
      email: 'test@example.com',
      email_verified: true,
      given_name: 'John',
      middle_name: 'Q',
      family_name: 'Doe',
      name: 'John Q Doe',
      picture: "https://example.com/pic.jpg",
      address: '123 Main St',
    }

    const result = parseUserProfile(payload)!
    expect(result.userId).toBe('abc123')
    expect(result.email).toBe('test@example.com')
    expect(result.emailVerified).toBe(true)
    expect(result.firstName).toBe('John')
    expect(result.middleName).toBe('Q')
    expect(result.lastName).toBe('Doe')
    expect(result.fullName).toBe('John Q Doe')
    expect(result.picture).toBe("https://example.com/pic.jpg")
    expect(result.address).toBe('123 Main St')
    expect(result.username).toBe('test@example.com')
    expect(result.providerType).toBe('Cognito')
    expect(result.isSAMLUser).toBe(false)
  })

  it('should parse custom claims correctly', () => {
    const payload = {
      sub: 'abc123',
      'custom:role': 'admin',
      'custom:supervisor_name': 'Jane Smith',
      'custom:supervisor_email': 'jane@example.com',
      'custom:supervisor_user_id': 'sup123',
      'custom:phone_number': '+1234567890',
      'custom:phone_number_verified': true,
      'custom:groups': 'group1, group2 , group3',
      'custom:area_code': '12345',
      'custom:city': 'Testville',
      'custom:state': 'TS',
      'custom:country': 'Testland',
      'custom:country_calling_code': '+99',
      'custom:department': 'Engineering',
      'custom:bargain': 'None',
      'custom:employee_number': 'E123',
      'custom:department_head_full_name': 'Head Honcho',
      'custom:department_head_email': 'honcho@example.com',
    }

    const result = parseUserProfile(payload)!
    expect(result.role).toBe('admin')
    expect(result.supervisor).toEqual({
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      providerUserId: 'sup123',
    })
    expect(result.phoneNumber).toBe('+1234567890')
    expect(result.phoneNumberVerified).toBe(true)
    expect(result.groups).toEqual(['group1', 'group2', 'group3'])
    expect(result.areaCode).toBe('12345')
    expect(result.city).toBe('Testville')
    expect(result.state).toBe('TS')
    expect(result.country).toBe('Testland')
    expect(result.countryCallingCode).toBe('+99')
    expect(result.department).toBe('Engineering')
    expect(result.bargain).toBe('None')
    expect(result.employeeNumber).toBe('E123')
    expect(result.departmentHeadFullName).toBe('Head Honcho')
    expect(result.departmentHeadEmail).toBe('honcho@example.com')
  })

  it('should set supervisor to undefined if all fields are missing', () => {
    const payload = {
      sub: 'abc123',
    }

    const result = parseUserProfile(payload)!
    expect(result.supervisor).toBeUndefined()
  })

  it('should handle identities and SAML user correctly', () => {
    const payload = {
      sub: 'abc123',
      identities: [
        {
          providerType: 'SAML',
          userId: 'samlUser123',
        },
      ],
      preferred_username: 'sam.l.user',
    }

    const result = parseUserProfile(payload)!
    expect(result.providerType).toBe('SAML')
    expect(result.providerUserId).toBe('samlUser123')
    expect(result.isSAMLUser).toBe(true)
    expect(result.username).toBe('sam.l.user')
  })

  it('should fallback to userId as username if email not present', () => {
    const payload = {
      sub: 'abc123',
    }

    const result = parseUserProfile(payload)!
    expect(result.username).toBe('abc123')
  })
})

describe('getUserFriendlyName', () => {
  it('should return fullName if present', () => {
    const user: MiscTypes.UserProfile = {
      userId: 'abc',
      username: 'abc',
      fullName: 'Jane Doe',
    }
    expect(getUserFriendlyName(user)).toBe('Jane Doe')
  })

  it('should return "firstName lastName" if fullName is missing', () => {
    const user: MiscTypes.UserProfile = {
      userId: 'abc',
      username: 'abc',
      firstName: 'Jane',
      lastName: 'Doe',
    }
    expect(getUserFriendlyName(user)).toBe('Jane Doe')
  })

  it('should return only firstName or lastName if one is missing', () => {
    expect(
      getUserFriendlyName({ userId: 'u1', username: 'u1', firstName: 'Jane' }),
    ).toBe('Jane')
    expect(
      getUserFriendlyName({ userId: 'u1', username: 'u1', lastName: 'Doe' }),
    ).toBe('Doe')
  })

  it('should return email if fullName and names are missing', () => {
    expect(
      getUserFriendlyName({
        userId: 'u1',
        username: 'u1',
        email: 'user@example.com',
      }),
    ).toBe('user@example.com')
  })

  it('should return username if email and names are missing', () => {
    expect(getUserFriendlyName({ userId: 'u1', username: 'username1' })).toBe(
      'username1',
    )
  })

  it('should return userId if everything else is missing', () => {
    expect(getUserFriendlyName({ userId: 'abc', username: '' })).toBe('abc')
  })
})
