import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SAO NIS2 Compliance API',
      version: '1.0.0',
      description: 'API de gestion de la conformité NIS2 (Directive EU 2022/2555)',
      contact: { name: 'SAO NIS2 Team', email: 'contact@sao-nis2.eu' },
      license: { name: 'MIT' },
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Schémas communs
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: {} },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Min 8 chars, majuscule, minuscule, chiffre, spécial',
            },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            organizationId: { type: 'string', format: 'uuid' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: {
                  type: 'string',
                  enum: ['ADMIN', 'COMPLIANCE_OFFICER', 'AUDITOR', 'VIEWER'],
                },
              },
            },
          },
        },
        // Organization
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            sector: {
              type: 'string',
              enum: [
                'ENERGY',
                'TRANSPORT',
                'BANKING',
                'FINANCIAL_MARKETS',
                'HEALTH',
                'DRINKING_WATER',
                'WASTEWATER',
                'DIGITAL_INFRASTRUCTURE',
                'ICT_SERVICE',
                'PUBLIC_ADMIN',
                'SPACE',
                'POSTAL',
                'WASTE_MANAGEMENT',
                'CHEMICAL',
                'FOOD',
                'MANUFACTURING',
                'DIGITAL_PROVIDERS',
                'RESEARCH',
              ],
            },
            entityType: { type: 'string', enum: ['ESSENTIAL', 'IMPORTANT'] },
            country: { type: 'string' },
            contactEmail: { type: 'string', format: 'email' },
          },
        },
        // Incident
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            status: {
              type: 'string',
              enum: [
                'DRAFT',
                'DETECTED',
                'REPORTED_INITIAL',
                'INVESTIGATING',
                'REPORTED_FINAL',
                'RESOLVED',
                'CLOSED',
              ],
            },
            detectedAt: { type: 'string', format: 'date-time' },
            reportedToAuthority: { type: 'boolean' },
          },
        },
        // Risk
        Risk: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'NETWORK',
                'SUPPLY_CHAIN',
                'HUMAN',
                'PHYSICAL',
                'SOFTWARE',
                'HARDWARE',
                'DATA',
                'LEGAL',
                'OPERATIONAL',
              ],
            },
            likelihood: { type: 'integer', minimum: 1, maximum: 5 },
            impact: { type: 'integer', minimum: 1, maximum: 5 },
            riskScore: { type: 'integer', minimum: 1, maximum: 25 },
            status: {
              type: 'string',
              enum: ['IDENTIFIED', 'ASSESSED', 'MITIGATING', 'MITIGATED', 'ACCEPTED', 'CLOSED'],
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion des sessions' },
      {
        name: 'Organizations',
        description: 'Gestion des entités NIS2 (essentielles et importantes)',
      },
      { name: 'Compliance', description: 'Suivi de conformité Article 21 NIS2' },
      { name: 'Incidents', description: 'Gestion des incidents de sécurité (Art. 23 NIS2)' },
      { name: 'Risks', description: 'Évaluation et gestion des risques' },
      { name: 'Audits', description: 'Audits internes, externes et réglementaires' },
      { name: 'Reports', description: 'Génération de rapports de conformité' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
