import {
    EnumRequired,
    StringNotRequired,
    StringRequired,
} from '~/common/decorators';
import { export_format } from '~/models/cv_exports.model';

export class CreateExportDto {
    @StringRequired('cv_id')
    cv_id!: string;
    @EnumRequired('format', export_format)
    format: export_format = export_format.PDF;
    @StringRequired('created_by')
    created_by!: string;
    @StringNotRequired('file_url')
    file_url?: string;
}
