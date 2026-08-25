import multer from 'multer';

/**
 * Upload en mémoire pour l'import de positions/carburant depuis des fichiers
 * CSV ou Excel exportés des boîtiers GPS. Le fichier est disponible sous
 * `req.file.buffer` et parsé dans le service (csv-parse / xlsx).
 */
export const uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || /\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or Excel files are accepted'));
    }
  },
});
