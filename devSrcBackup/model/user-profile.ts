/**
 * see com.dashjoin.service.tenant.TenantService.UserProfile
 */
export interface UserProfile {

    /**
     * IDM user name
     */
    username: string

    /**
     * IDM email, undefined for local users
     */
    email?: string

    /**
     * roles the user is in
     */
    roles?: string[]

    /**
     * user UI settings (homepage, darkmode, theme, etc.)
     */
    settings: any
}