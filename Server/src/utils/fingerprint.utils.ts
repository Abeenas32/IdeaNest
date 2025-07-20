import crypto from 'crypto'
import { Request } from "express";

export const generateAnonymousFingerPrint = (req: Request): string => {
    const components = [
        req.ip || 'unknown-ip',
        req.get('User-Agent') || 'unknown-ua',
        req.get('Accept-Language') || 'unknown-lang',
        req.get('Accept-Encoding') || 'unknown-enc'
    ]
     const fingerPrint = components.join('|');
     return crypto.createHash('sha256').update(fingerPrint).digest('hex')
};