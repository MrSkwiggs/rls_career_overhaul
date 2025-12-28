<template>
  <div class="gameplay-details" :class="{ 'inline': inline }">
    <div class="details" v-bng-ui-nav-scroll.force bng-nav-scroll>
      <div class="header-content" v-if="activeItemDetails?.headerTitle">
        <BngCardHeading type="none" class="header-title" v-if="showHeaderTitle">
          {{ activeItemDetails.headerTitle }}
        </BngCardHeading>
        <div class="preview" v-if="activeItemDetails?.preview">
          <AspectRatio class="preview-image" :ratio="'16:8'" :external-image="activeItemDetails.preview" :class="{ 'has-header-title': showHeaderTitle }">
            <BngIcon
              v-if="!inline"
              class="favourite-icon"
              :type="activeItemDetails?.isFavourite ? 'star' : 'starSecondary'"
              @click="toggleFavourite(activeItem)"
              :color="activeItemDetails?.isFavourite ? 'var(--bng-ter-yellow-50)' : 'var(--bng-cool-gray-100)'"
            />
          </AspectRatio>
        </div>
        <!-- Tags section -->
        <div class="tags-section" v-if="activeItemDetails?.tags?.length > 0">
          <div class="tags-container">
            <template v-for="tag in activeItemDetails.tags" :key="tag.key || tag.label">
              <div class="tag-item" :class="{ 'clickable': tag.goToMod }" @click="tag.goToMod ? goToMod(tag.goToMod) : null">
                <BngIcon v-if="tag.icon" :type="tag.icon" />
                <img class="svg-icon" v-if="tag.svg" :src="tag.svg" />
                {{ tag.label }}
              </div>
            </template>
          </div>
        </div>
        <div class="description" v-if="activeItemDetails?.description">
          {{ activeItemDetails.description }}
        </div>

      </div>

      <template v-if="activeItemDetails?.buttonInfo?.length > 0 || activeItemDetails?.bottomTags?.length > 0">
        <template v-for="(specList, specListIndex) in activeItemDetails?.specifications" :key="specListIndex">
          <div class="specs-grid" v-if="specList.length > 0">
            <div class="specs-grid-container">
              <template v-for="specification in specList" :key="specification.key">
                <div class="spec-cell">
                  <BngIcon v-if="specification.icon" :type="specification.icon" class="spec-icon" />
                  <div class="spec-content">
                    <div class="spec-label">{{ specification.label }}:</div>
                    <div class="spec-value">
                      <span>{{ specification.value }}</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </template>
    </div>

    <div class="bottom-section" v-if="activeItemDetails?.buttonInfo?.length > 0 || buttonOverride" >
      <div class="buttons-section">
        <template v-if="!buttonOverride">
          <template v-for="button in activeItemDetails.buttonInfo" :key="button.buttonId">
            <div class="button-container">
              <BngButton
                :bng-scoped-nav-autofocus="button.primary"
                :accent="button.primary ? 'main' : 'secondary'"
                :label="button.label"
                :icon="button.icon"
                @click="handleButtonClick(button.buttonId)" />
            </div>
          </template>
        </template>
        <template v-if="buttonOverride">
          <div class="button-container">
            <BngButton
              :bng-scoped-nav-autofocus="true"
              :accent="'main'"
              :label="buttonOverride.label"
              :icon="buttonOverride.icon"
              @click="buttonOverride.click(activeItem)" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BngButton, BngIcon, BngCardHeading } from "@/common/components/base"
import { AspectRatio } from "@/common/components/utility"
import { vBngUiNavScroll } from "@/common/directives"

const props = defineProps({
  activeItem: {
    type: Object,
    default: null,
  },
  activeItemDetails: {
    type: Object,
    default: null,
  },
  executeButton: {
    type: Function,
    default: () => {},
  },
  toggleFavourite: {
    type: Function,
    default: () => {},
  },
  exploreFolder: {
    type: Function,
    default: () => {},
  },
  goToMod: {
    type: Function,
    default: () => {},
  },
  showHeaderTitle: {
    type: Boolean,
    default: true,
  },
  inline: {
    type: Boolean,
    default: false,
  },
  buttonOverride: {
    type: Object,
    default: null,
  },
})

const handleButtonClick = (buttonId) => {
  props.executeButton(buttonId)
}

</script>

<style scoped lang="scss">
.gameplay-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  color: white;
  height: 100%;
}

.inline {
  .details {
    padding: 0;
    .header-content {
      border-radius: 0;
      .preview {
        border-radius: 0;
        .preview-image {
          border-radius: 0;
        }
      }
      background-color: transparent;
      flex: 1 1 auto;
      .description {
      }
    }
  }
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  max-width: 100%;
  overflow-x: hidden;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0.25rem 0 ;
}

.preview {
  flex: 0 1 auto;
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  align-self: stretch;
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.4);
}

.preview-image {
  width: 100%;
  overflow: hidden;
  justify-self: center;
  align-self: center;
  position: relative;
  border-radius: 0.5rem 0.5rem 0 0;

  &.has-header-title {
    border-radius: unset;
  }
}

.favourite-icon {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 2.5rem;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  z-index: 2;
  cursor: pointer;
  &:hover {
    scale: 1.33;
  }
}

.header-content {
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.5rem;
}


.description {
  font-size: 0.8rem;
  text-align: justify;
  padding: 0.75rem;
  padding-top: 0.25rem;
}

.tags-section {
  padding: 0.5rem 0.5rem;
  padding-bottom: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tags-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.tag-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.5rem;
  font-size: 0.8rem;
  gap: 0.25rem;
  background-color: rgba(0, 0, 0, 0.25);
  border-radius: 0.25rem;
  height: 1.5rem;
  cursor: default;

  &.clickable {
    cursor: pointer;
    &:hover {
      background-color: rgba(0, 0, 0, 0.4);
    }
  }

  .svg-icon {
    width: 1rem;
    height: 1rem;
  }
}

.bottom-section {
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.25);
  padding: 0.5rem;
  gap: 0.25rem;
  margin-top: 0.1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.buttons-section {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.button-container {
  width: 100%;
}

.button-container :deep(.bng-button) {
  max-width: unset;
  width: calc(100% - 0.5rem);
  align-items: center;
}

.button-container :deep(.bng-button .label) {
  text-align: center;
}

.button-container :deep(.bng-button .icon) {
  transform: none;
}


.specs-grid {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.specs-grid-container {
  display: grid;
  grid-template-columns: 1fr ;
}

.spec-cell {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.125rem 0.25rem;
}

.spec-icon {
  font-size: 2rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  align-self: flex-start;
}

.spec-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.125rem;
}

.spec-label {
  font-size: 0.8rem;
  font-weight: 300;
  text-align: left;
}

.spec-value {
  font-size: 0.8rem;
  font-weight: 500;
}


</style>
