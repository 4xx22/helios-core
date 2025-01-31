import { DisplayableError, RestResponse } from '../../common/rest/RestResponse'

/**
 * @see https://wiki.vg/Authentication#Errors
 */
export enum MojangErrorCode {
    ERROR_METHOD_NOT_ALLOWED,       // INTERNAL
    ERROR_NOT_FOUND,                // INTERNAL
    ERROR_USER_MIGRATED,
    ERROR_INVALID_CREDENTIALS,
    ERROR_RATELIMIT,
    ERROR_INVALID_TOKEN,
    ERROR_ACCESS_TOKEN_HAS_PROFILE, // ??
    ERROR_CREDENTIALS_MISSING,      // INTERNAL
    ERROR_INVALID_SALT_VERSION,     // ??
    ERROR_UNSUPPORTED_MEDIA_TYPE,   // INTERNAL
    ERROR_GONE,
    ERROR_UNREACHABLE,
    ERROR_NOT_PAID,                 // Not automatically detected, response is 200 with a certain body.
    UNKNOWN
}

export function mojangErrorDisplayable(errorCode: MojangErrorCode): DisplayableError {
    switch(errorCode) {
        case MojangErrorCode.ERROR_METHOD_NOT_ALLOWED:
            return {
                title: 'Erreur interne : <br>Méthode non autorisée',
                desc: 'Méthode non autorisée. Veuillez signaler cette erreur.'
            };
        case MojangErrorCode.ERROR_NOT_FOUND:
            return {
                title: 'Erreur interne : <br>Terminaison introuvable',
                desc: "Le point de terminaison d'authentification n'a pas été trouvé. Veuillez signaler ce problème"
            };
        case MojangErrorCode.ERROR_INVALID_CREDENTIALS:
            return {
                title: 'Erreur lors de la connexion:<br>Login invalides',
                desc: "L'e-mail ou le mot de passe que vous avez saisi est incorrect. Veuillez réessayer."
            };
        case MojangErrorCode.ERROR_RATELIMIT:
            return {
                title: 'Erreur pendant la connexion : Trop de tentatives.',
                desc: 'Il y a eu trop de tentatives de connexion avec ce compte récemment. Veuillez réessayer plus tard.'
            };
        case MojangErrorCode.ERROR_INVALID_TOKEN:
            return {
                title: 'Erreur pendant la connexion : Token invalide.',
                desc: "Le token d'accès fourni n'est pas valide"
            };
        case MojangErrorCode.ERROR_ACCESS_TOKEN_HAS_PROFILE:
            return {
                title: 'Error During Login:<br>Token Has Profile',
                desc: 'Access token already has a profile assigned. Selecting profiles is not implemented yet.'
            };
        case MojangErrorCode.ERROR_CREDENTIALS_MISSING:
            return {
                title: 'Erreur lors de la connexion : <br>Login manquants',
                desc: "Le nom d'utilisateur/mot de passe n'a pas été soumis ou le mot de passe comporte moins de 3 caractères."
            };
        case MojangErrorCode.ERROR_INVALID_SALT_VERSION:
            return {
                title: 'Erreur lors de la connexion:<br>Invalid Salt Version',
                desc: 'Version de salt invalide.'
            };
        case MojangErrorCode.ERROR_UNSUPPORTED_MEDIA_TYPE:
            return {
                title: 'Erreur interne : <br>Type de média non supporté',
                desc: 'Type de média non supporté. Veuillez signaler cette erreur.'
            };
        case MojangErrorCode.ERROR_UNREACHABLE:
            return {
                title: 'Erreur lors de la connexion:<br>Inaccessible',
                desc: "Impossible d'atteindre les serveurs d'authentification. Assurez-vous qu'ils sont en ligne et que vous êtes connecté à l'Internet."
            };
        case MojangErrorCode.UNKNOWN:
            return {
                title: 'Erreur inconnue pendant la connexion',
                desc: "Une erreur inconnue s'est produite, merci de contacter un Administrateur."
            };
        default:
            throw new Error(`Unknown error code: ${errorCode}`);
    }

}

export interface MojangResponse<T> extends RestResponse<T> {
    mojangErrorCode?: MojangErrorCode
    isInternalError?: boolean
}

export interface MojangErrorBody {
    error: string
    errorMessage: string
    cause?: string
}

/**
 * Resolve the error response code from the response body.
 * 
 * @param body The mojang error body response.
 */
export function decipherErrorCode(body: MojangErrorBody): MojangErrorCode {

    if(body.error === 'Method Not Allowed') {
        return MojangErrorCode.ERROR_METHOD_NOT_ALLOWED
    } else if(body.error === 'Not Found') {
        return MojangErrorCode.ERROR_NOT_FOUND
    } else if(body.error === 'Unsupported Media Type') {
        return MojangErrorCode.ERROR_UNSUPPORTED_MEDIA_TYPE
    } else if(body.error === 'ForbiddenOperationException') {

        if(body.cause && body.cause === 'UserMigratedException') {
            return MojangErrorCode.ERROR_USER_MIGRATED
        }

        if(body.errorMessage === 'Invalid credentials. Invalid username or password.') {
            return MojangErrorCode.ERROR_INVALID_CREDENTIALS
        } else if(body.errorMessage === 'Invalid credentials.') {
            return MojangErrorCode.ERROR_RATELIMIT
        } else if(body.errorMessage === 'Invalid token.') {
            return MojangErrorCode.ERROR_INVALID_TOKEN
        } else if(body.errorMessage === 'Forbidden') {
            return MojangErrorCode.ERROR_CREDENTIALS_MISSING
        }

    } else if(body.error === 'IllegalArgumentException') {

        if(body.errorMessage === 'Access token already has a profile assigned.') {
            return MojangErrorCode.ERROR_ACCESS_TOKEN_HAS_PROFILE
        } else if(body.errorMessage === 'Invalid salt version') {
            return MojangErrorCode.ERROR_INVALID_SALT_VERSION
        }

    } else if(body.error === 'ResourceException' || body.error === 'GoneException') {
        return MojangErrorCode.ERROR_GONE
    }

    return MojangErrorCode.UNKNOWN

}

// These indicate problems with the code and not the data.
export function isInternalError(errorCode: MojangErrorCode): boolean {
    switch(errorCode) {
        case MojangErrorCode.ERROR_METHOD_NOT_ALLOWED:       // We've sent the wrong method to an endpoint. (ex. GET to POST)
        case MojangErrorCode.ERROR_NOT_FOUND:                // Indicates endpoint has changed. (404)
        case MojangErrorCode.ERROR_ACCESS_TOKEN_HAS_PROFILE: // Selecting profiles isn't implemented yet. (Shouldnt happen)
        case MojangErrorCode.ERROR_CREDENTIALS_MISSING:      // Username/password was not submitted. (UI should forbid this)
        case MojangErrorCode.ERROR_INVALID_SALT_VERSION:     // ??? (Shouldnt happen)
        case MojangErrorCode.ERROR_UNSUPPORTED_MEDIA_TYPE:   // Data was not submitted as application/json
            return true
        default:
            return false
    }
}