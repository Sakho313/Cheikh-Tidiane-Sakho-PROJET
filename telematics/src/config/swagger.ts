import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SAO Telematics API',
      version: '1.0.0',
      description:
        'API de gestion de flotte télématique : géolocalisation, comportement de conduite, carburant et rapports.',
      contact: { name: 'SAO Telematics Team' },
      license: { name: 'MIT' },
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        deviceApiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' },
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
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et sessions' },
      { name: 'Vehicles', description: 'Parc de véhicules' },
      { name: 'Devices', description: 'Boîtiers GPS' },
      { name: 'Drivers', description: 'Chauffeurs' },
      { name: 'Trips', description: 'Trajets' },
      { name: 'Telemetry', description: 'Ingestion de positions GPS (REST, fichier, temps réel)' },
      { name: 'Events', description: 'Événements de conduite' },
      { name: 'Fuel', description: 'Carburant : pleins, consommation, vol' },
      { name: 'Geofences', description: 'Zones géographiques' },
      { name: 'Alerts', description: 'Alertes' },
      { name: 'Maintenance', description: 'Entretien des véhicules' },
      { name: 'Analytics', description: 'Scores de conduite et tableaux de bord' },
      { name: 'Reports', description: 'Génération de rapports' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
