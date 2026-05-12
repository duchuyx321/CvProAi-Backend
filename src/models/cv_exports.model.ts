import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Cvs, Cv_versions, Users } from '~/models';

export enum export_format {
    PDF = 'PDF',
    DOCX = 'DOCX',
    JSON = 'JSON',
}

@Table({
    tableName: 'cv_exports',
    timestamps: true,
    underscored: true,
})
export class Cv_exports extends Model<Cv_exports> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Cvs)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    cv_id!: string;

    @ForeignKey(() => Cv_versions)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    version_id?: string;

    @Column({
        type: DataType.ENUM(...Object.values(export_format)),
        allowNull: false,
        defaultValue: export_format.PDF,
    })
    format!: export_format;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    file_url!: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    html_content?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    css_content?: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    created_by?: string;

    @BelongsTo(() => Cvs)
    declare cv?: Cvs;

    @BelongsTo(() => Cv_versions, 'version_id')
    declare cv_version?: Cv_versions;

    @BelongsTo(() => Users, 'created_by')
    declare creator?: Users;
}
