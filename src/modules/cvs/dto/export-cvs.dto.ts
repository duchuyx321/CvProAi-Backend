import { StringRequired } from '~/common/decorators';

export class ExportCvsDto {
    @StringRequired('htmlText')
    htmlText!: string;
    @StringRequired('cssText')
    cssText!: string;
}
