<script lang="ts">
import { Vue, Component, Watch } from '@/utils/vue-imports';
import EventBus from '@/utils/eventBus';
import SelectionModal from '@/components/Shared/Modals/PrimeVue/SelectionModal.vue';
import UserFeedbackModel from '@/models/UserFeedbackModel';
import { UserFeedbackType } from '@/common/UserFeedbackEnums';
import { datadogRum } from '@datadog/browser-rum';
import BrainKeyList from '@/components/V2/Analytics/BrainKeyList.vue';
import AnalyticGroupModel from '@/models/V2/Analytic/AnalyticGroupModel';
import BrainKeyModel from '@/models/V2/BrainKey/BrainKeyModel';

@Component({
  name: 'analytics-page',
  components: {
    BrainKeyList,
    SelectionModal,
  },
})
export default class AnalyticsPage extends Vue {
  //Data
  drawer = true;
  analyticGroupId = '';
  loading = false;
  navigationWidth = 350 + 'px';
  pageReady = false;
  showTemplateDialog = false;
  templates: AnalyticGroupModel[] = [];
  readonly highlightEmitEvent = 'update-analytic-group-highlight';

  // Computed
  get tenantId(): string {
    return this.$route.params.tenantId;
  }

  async created(): Promise<void> {
    this.loading = true;
    const tenantId = this.$router.currentRoute.params.tenantId;
    datadogRum.addAction('Analytics', { tenant: this.tenantId });
    this.analyticGroupId = this.$router.currentRoute.params.analyticGroupId;

    await this.loadAnalyticGroups(tenantId, this.analyticGroupId);
    this.loading = false;
  }

  @Watch('tenantId')
  async onTenantChange(newVal: string, oldVal: string): Promise<void> {
    if (newVal != oldVal && this.pageReady) {
      await this.loadAnalyticGroups(newVal);
    }
  }

  onTemplateModalVisible(templates: AnalyticGroupModel[]): void {
    this.templates = templates;
    this.showTemplateDialog = true;
  }

  async onTemplateCopy(template: AnalyticGroupModel): Promise<void> {
    this.analyticGroupId = (await AnalyticGroupModel.copyAnalyticGroup(template, this.tenantId))?.Id;
    this.$nextTick(() => {
      EventBus.$emit(this.highlightEmitEvent, this.analyticGroupId);
    });
    UserFeedbackModel.updateSnackbar({
      Type: UserFeedbackType.SuccessMessage,
      Text: `Analytic Group Created From Template`,
      Closable: false,
    });
  }

  async loadAnalyticGroups(tenantId: string, analyticGroupId?: string): Promise<void> {
    AnalyticGroupModel.deleteAll();
    BrainKeyModel.deleteAll();
    await AnalyticGroupModel.listAnalyticGroups(tenantId);
    this.loading = true;
    if (!analyticGroupId) {
      const analyticGroup = AnalyticGroupModel.query()
        .where((w: AnalyticGroupModel) => w.TenantId == this.tenantId)
        .orderBy('SequenceOrder')
        .first();
      this.analyticGroupId = analyticGroup != null ? analyticGroup.Id : null;
      await this.onUpdateAnalyticGroup(this.analyticGroupId);
    } else {
      EventBus.$emit(this.highlightEmitEvent, analyticGroupId);
      this.loading = false;
    }
    this.pageReady = true;
    if (analyticGroupId || this.analyticGroupId) {
      await BrainKeyModel.fetchBrainKeys(this.tenantId);
      await BrainKeyModel.fetchAnalytics(this.tenantId, analyticGroupId ?? this.analyticGroupId);
    }
  }

  async onUpdateAnalyticGroup(analyticGroupId?: string): Promise<void> {
    this.analyticGroupId = analyticGroupId;
    this.loading = false;
    this.$nextTick(() => {
      EventBus.$emit(this.highlightEmitEvent, analyticGroupId);
    });
  }
}
</script>