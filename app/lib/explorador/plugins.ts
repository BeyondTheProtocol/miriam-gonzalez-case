// @ts-nocheck — copia literal (tipos sueltos) de la lista de coordinación de Vitessce.
/**
 * Plugins mínimos de Vitessce para el explorador de /celula-a-celula/explorar.
 *
 * Por qué no `vitessce` entero: el paquete agregado arrastra @vitessce/all, que trae neuroglancer con
 * una dependencia git (`ikonate`) que pnpm 11 bloquea (`blockExoticSubdeps`), y además cargaría vistas
 * espaciales, 3D y de imagen que aquí no se usan. Se registran SOLO las piezas que usa la página:
 * scatterplot de embedding, gestor de conjuntos y los cargadores CSV (embedding, conjuntos y matriz).
 *
 * `COORDINACION` es copia literal de `baseCoordinationTypes` de @vitessce/all@4.1.0
 * (src/base-plugins.ts), licencia MIT, © Gehlenborg Lab: VitS exige que estén declarados todos los
 * tipos de coordinación que el esquema conoce, aunque la vista no los use. Al actualizar Vitessce,
 * se vuelve a copiar de la versión nueva.
 */
import { CoordinationType, COMPONENT_COORDINATION_TYPES, DataType, FileType, ViewType } from '@vitessce/constants-internal'
import { PluginCoordinationType, PluginFileType, PluginViewType } from '@vitessce/plugins'
import {
  annotationShapesArray, annotationStoryObj, cellsLayerObj, imageLayerObj, moleculesLayerObj, neighborhoodsLayerObj,
  obsEmbeddingCsvSchema, obsSetPath, obsSetsCsvSchema, obsSetsSchema, rgbArray, z,
} from '@vitessce/schemas'
import { CsvSource, ObsEmbeddingCsvLoader, ObsFeatureMatrixCsvLoader, ObsSetsCsvLoader } from '@vitessce/csv'
import { ObsSetsManagerSubscriber } from '@vitessce/obs-sets-manager'
import { EmbeddingScatterplotSubscriber } from '@vitessce/scatterplot-embedding'

const vista = (nombre: string, componente: unknown) => new PluginViewType(nombre, componente, COMPONENT_COORDINATION_TYPES[nombre])

export const VISTAS = [
  vista(ViewType.SCATTERPLOT, EmbeddingScatterplotSubscriber),
  vista(ViewType.OBS_SETS, ObsSetsManagerSubscriber),
]

export const FICHEROS = [
  new PluginFileType(FileType.OBS_EMBEDDING_CSV, DataType.OBS_EMBEDDING, ObsEmbeddingCsvLoader, CsvSource, obsEmbeddingCsvSchema),
  new PluginFileType(FileType.OBS_SETS_CSV, DataType.OBS_SETS, ObsSetsCsvLoader, CsvSource, obsSetsCsvSchema),
  new PluginFileType(FileType.OBS_FEATURE_MATRIX_CSV, DataType.OBS_FEATURE_MATRIX, ObsFeatureMatrixCsvLoader, CsvSource, z.null()),
]

export const COORDINACION = [
    new PluginCoordinationType(CoordinationType.META_COORDINATION_SCOPES, null, z.record(z.any()).nullable()),
    new PluginCoordinationType(CoordinationType.META_COORDINATION_SCOPES_BY, null, z.record(z.any()).nullable()),
    new PluginCoordinationType(CoordinationType.DATASET, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.OBS_TYPE, 'cell', z.string()),
    new PluginCoordinationType(CoordinationType.FEATURE_TYPE, 'gene', z.string()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_TYPE, 'expression', z.string()),
    new PluginCoordinationType(CoordinationType.OBS_LABELS_TYPE, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_LABELS_TYPE, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_ZOOM, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_ROTATION, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_TARGET_X, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_TARGET_Y, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_TARGET_Z, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_TYPE, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_SET_POLYGONS_VISIBLE, false, z.boolean()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_SET_LABELS_VISIBLE, false, z.boolean()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_SET_LABEL_SIZE, 14, z.number()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_RADIUS, 1, z.number()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_OPACITY, 1, z.number()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_RADIUS_MODE, 'auto', z.enum(['manual', 'auto'])),
    new PluginCoordinationType(CoordinationType.EMBEDDING_OBS_OPACITY_MODE, 'auto', z.enum(['manual', 'auto'])),
    new PluginCoordinationType(CoordinationType.SPATIAL_ZOOM, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ROTATION, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_X, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_Y, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_Z, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ROTATION_X, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ROTATION_Y, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ROTATION_Z, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ROTATION_ORBIT, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_ORBIT_AXIS, 'Y', z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_AXIS_FIXED, false, z.boolean().nullable()),
    // A raw 3D camera state, shared between spatialBeta and neuroglancer views.
    // A non-null value indicates that both views are present and should be synchronized.
    new PluginCoordinationType(CoordinationType.SPATIAL_CAMERA_SNAPSHOT, null, z.object({
        // Orbit target / pivot point.
        position: z.array(z.number()).length(3),
        // Camera orientation [x, y, z, w], in the Y-up frame used by spatialBeta.
        quaternion: z.array(z.number()).length(4),
        // Height of the visible region at the pivot (Neuroglancer's projectionScale).
        projectionScale: z.number(),
        fovDegrees: z.number(),
    }).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_IMAGE_LAYER, null, imageLayerObj.nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SEGMENTATION_LAYER, null, z.union([
        cellsLayerObj, imageLayerObj,
    ]).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_NEIGHBORHOOD_LAYER, null, neighborhoodsLayerObj.nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_POINT_LAYER, null, moleculesLayerObj.nullable()),
    new PluginCoordinationType(CoordinationType.HEATMAP_ZOOM_X, 0, z.number()),
    new PluginCoordinationType(CoordinationType.HEATMAP_ZOOM_Y, 0, z.number()),
    new PluginCoordinationType(CoordinationType.HEATMAP_TARGET_X, 0, z.number()),
    new PluginCoordinationType(CoordinationType.HEATMAP_TARGET_Y, 0, z.number()),
    new PluginCoordinationType(CoordinationType.OBS_FILTER, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_HIGHLIGHT, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SELECTION, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SET_SELECTION, null, z.array(obsSetPath).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SELECTION_MODE, null, z.enum(['obsSelection', 'obsSetSelection']).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SET_FILTER, null, z.array(obsSetPath).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_FILTER_MODE, null, z.enum(['obsFilter', 'obsSetFilter']).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SET_EXPANSION, null, z.array(obsSetPath).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SET_HIGHLIGHT, null, obsSetPath.nullable()),
    new PluginCoordinationType(CoordinationType.OBS_SET_COLOR, null, z.array(z.object({
        path: obsSetPath,
        color: rgbArray,
    })).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_COLOR, null, z.array(z.object({
        name: z.string(),
        color: rgbArray,
        opacity: z.number().min(0).max(1).optional(),
    })).nullable()),
    new PluginCoordinationType(CoordinationType.OBS_COLOR_ENCODING, 'cellSetSelection', z.enum([
        'geneSelection', 'cellSetSelection', 'spatialChannelColor', 'spatialLayerColor', 'obsLabels',
        // For per-observation colors loaded from an obsColors data type.
        'obsColors',
        // For point coloring.
        'random', 'randomByFeature',
    ])),
    new PluginCoordinationType(CoordinationType.FEATURE_FILTER, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_HIGHLIGHT, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_SELECTION, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_AGGREGATION_STRATEGY, null, z.union([
        z.enum([
            'first', 'last', 'mean', 'sum', 'difference',
        ]),
        // An index of a featureSelection array element.
        z.number(),
    ]).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_SET_SELECTION, null, z.array(obsSetPath).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_SELECTION_MODE, null, z.enum(['featureSelection', 'featureSetSelection']).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_SET_FILTER, null, z.array(obsSetPath).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_FILTER_MODE, null, z.enum(['featureFilter', 'featureSetFilter', 'featureSelection']).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_TRANSFORM, null, z.enum(['log1p', 'arcsinh']).nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_TRANSFORM_COEFFICIENT, 1, z.number()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_POSITIVITY_THRESHOLD, 0, z.number()),
    new PluginCoordinationType(CoordinationType.TOOLTIPS_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_COLORMAP, 'plasma', z.string().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_VALUE_COLORMAP_RANGE, [0.0, 1.0], z.array(z.number()).length(2)),
    new PluginCoordinationType(CoordinationType.GATING_FEATURE_SELECTION_X, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.GATING_FEATURE_SELECTION_Y, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.GENOMIC_ZOOM_X, 0, z.number()),
    new PluginCoordinationType(CoordinationType.GENOMIC_ZOOM_Y, 0, z.number()),
    new PluginCoordinationType(CoordinationType.GENOMIC_TARGET_X, 1549999999.5, z.number()),
    new PluginCoordinationType(CoordinationType.GENOMIC_TARGET_Y, 1549999999.5, z.number()),
    new PluginCoordinationType(CoordinationType.ADDITIONAL_OBS_SETS, null, obsSetsSchema.nullable()),
    new PluginCoordinationType(CoordinationType.MOLECULE_HIGHLIGHT, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.FILE_UID, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.IMAGE_LAYER, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.IMAGE_CHANNEL, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SEGMENTATION_LAYER, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SEGMENTATION_CHANNEL, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_C, null, z.number().or(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_LABEL, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_Z, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_T, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_OPACITY, 1.0, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_OPACITY_UNSELECTED, 0.25, z.number().min(0).max(1)),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_COLORMAP, null, z.string().nullable()), // TODO: enum to be more strict
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_TRANSPARENT_COLOR, null, z.array(z.number()).length(3).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_MODEL_MATRIX, null, z.array(z.number()).length(16).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_OPACITY, 1.0, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_WINDOW, null, z.array(z.number()).length(2).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_COLOR, [255, 255, 255], z.array(z.number()).length(3).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SEGMENTATION_FILLED, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SEGMENTATION_STROKE_WIDTH, 1.0, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_POINT_STROKE_WIDTH, 0.0, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LOD_FACTOR, 1.0, z.number()),
    // Reference: https://www.awaresystems.be/imaging/tiff/tifftags/photometricinterpretation.html
    new PluginCoordinationType(CoordinationType.PHOTOMETRIC_INTERPRETATION, null, z.enum(['BlackIsZero', 'RGB']).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_RENDERING_MODE, '2D', z.enum(['2D', '3D']).nullable()),
    new PluginCoordinationType(CoordinationType.VOLUMETRIC_RENDERING_ALGORITHM, 'additive', z.enum(['maximumIntensityProjection', 'additive'])),
    new PluginCoordinationType(CoordinationType.SPATIAL_TARGET_RESOLUTION, 0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_MAX_RESOLUTION, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SLICE_X, null, z.array(z.number()).length(2).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SLICE_Y, null, z.array(z.number()).length(2).nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SLICE_Z, null, z.array(z.number()).length(2).nullable()),
    new PluginCoordinationType(CoordinationType.SPOT_LAYER, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.POINT_LAYER, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SPOT_RADIUS, 25.0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SPOT_FILLED, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_SPOT_STROKE_WIDTH, 1.0, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_LAYER_COLOR, null, z.array(z.number()).length(3).nullable()),
    new PluginCoordinationType(CoordinationType.PIXEL_HIGHLIGHT, null, z.array(z.number()).length(3).nullable()),
    new PluginCoordinationType(CoordinationType.TOOLTIP_CROSSHAIRS_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.LEGEND_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_LABELS_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_LABELS_ORIENTATION, 'vertical', z.enum(['vertical', 'horizontal'])),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNEL_LABEL_SIZE, 14, z.number()),
    new PluginCoordinationType(CoordinationType.SPATIAL_CHANNELS_SORT_ORDER, 'original', z.enum(['original', 'alphabetical'])),
    new PluginCoordinationType(CoordinationType.SAMPLE_TYPE, 'sample', z.string().nullable()),
    // TODO: remove one array level and use multi-coordination for sampleSetSelection?
    new PluginCoordinationType(CoordinationType.SAMPLE_FILTER, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_SELECTION, null, z.array(z.string()).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_SET_SELECTION, null, z.array(z.array(z.string())).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_SET_FILTER, null, z.array(z.array(z.string())).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_SELECTION_MODE, null, z.enum(['sampleSelection', 'sampleSetSelection']).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_FILTER_MODE, null, z.enum(['sampleFilter', 'sampleSetFilter']).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_SET_COLOR, null, z.array(z.object({
        path: obsSetPath,
        color: rgbArray,
    })).nullable()),
    new PluginCoordinationType(CoordinationType.SAMPLE_HIGHLIGHT, null, z.string().nullable()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_POINTS_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_CONTOURS_VISIBLE, false, z.boolean()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_CONTOURS_FILLED, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.EMBEDDING_CONTOUR_PERCENTILES, null, z.array(z.number()).nullable()),
    new PluginCoordinationType(CoordinationType.CONTOUR_COLOR_ENCODING, 'cellSetSelection', z.enum(['cellSetSelection', 'sampleSetSelection', 'contourColor'])),
    new PluginCoordinationType(CoordinationType.CONTOUR_COLOR, null, rgbArray.nullable()),
    new PluginCoordinationType(CoordinationType.HIERARCHY_LEVELS, null, z.array(z.enum(['sampleSet', 'obsSet'])).nullable()),
    // For volcano plot:
    new PluginCoordinationType(CoordinationType.FEATURE_POINT_SIGNIFICANCE_THRESHOLD, 0.01, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_LABEL_SIGNIFICANCE_THRESHOLD, 0.01, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_POINT_FOLD_CHANGE_THRESHOLD, 1.0, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.FEATURE_LABEL_FOLD_CHANGE_THRESHOLD, 5.0, z.number().nullable()),
    // Annotation frames
    new PluginCoordinationType(CoordinationType.ANNOTATION_STORY, null, annotationStoryObj.nullable()),
    new PluginCoordinationType(CoordinationType.ANNOTATION_SHAPES, null, annotationShapesArray.nullable()),
    new PluginCoordinationType(CoordinationType.ANNOTATION_FRAME_INDEX, null, z.number().nullable()),
    new PluginCoordinationType(CoordinationType.ANNOTATION_OVERLAY_VISIBLE, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.ANNOTATION_TRANSITION_DURATION, 500, z.number()), // TODO: make this non-zero by default?
    new PluginCoordinationType(CoordinationType.ANNOTATION_SEMANTIC_ZOOM, true, z.boolean()),
    new PluginCoordinationType(CoordinationType.ANNOTATION_EDITABLE, false, z.boolean()),
]
