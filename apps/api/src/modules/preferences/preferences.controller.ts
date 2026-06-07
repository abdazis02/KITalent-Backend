import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PreferencesService } from './preferences.service';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@ApiTags('Preferences')
@ApiBearerAuth()
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly service: PreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user theme/locale preference (with tenant fallback)' })
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.service.get(user.id, user.tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update the current user theme/locale preference' })
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePreferenceDto) {
    return this.service.update(user.id, dto);
  }
}
