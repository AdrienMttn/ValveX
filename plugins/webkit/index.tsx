import { callable } from '@steambrew/webkit';


const PLUGIN_BUTTON_GET_IT_FOR_FREE_ATTR = 'get-it-for-free-button';
const PLUGIN_BUTTON_UPDATE_ATTR = 'update-button';
var currentAppId: string = "480";



type DownloadInfo = {
  success: boolean;
  message: string;
  available: boolean;
};

type UpdateInfo = {
  success: boolean;
  message: string;
  updated: boolean;
};

const download_manifest = callable<[{ appid: string; }], string>('download_game');
const manifest_exists = callable<[{ appid: string; }], string>('have_game_manifest');
const update_manifest = callable<[{ appid: string; }], string>('update_game');

function injectShopButton() {
	const target = document.querySelector('.queue_actions_ctn');
	if (!target) {
		return false;
	}

	if (target.querySelector(`[${PLUGIN_BUTTON_GET_IT_FOR_FREE_ATTR}]`)) {
		return true;
	}

  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appid') ?? window.location.pathname.match(/\/app\/(\d+)/)?.[1];
  if (!appId) {
    return false;
  }
  currentAppId = appId;
  console.log(appId);
  
  const div = document.createElement('div');
  div.style.width = 'fix-content';
  div.style.display = 'flex';
  div.style.flexDirection = 'row';
  div.style.alignItems = "stretch";
  

	const button = document.createElement('a');
	button.setAttribute(PLUGIN_BUTTON_GET_IT_FOR_FREE_ATTR, 'true');
	button.href = 'javascript:void(0)';
	button.className = 'btn_green_steamui btn_medium';
	button.style.width = '100%';
  button.style.textAlign = 'center';

  const span = document.createElement('span');
  span.textContent = 'Get it for free';
  

	button.addEventListener('click', async (event) => {
		event.preventDefault();
    document.body.style.cursor = 'wait';
		try {
			const result = await download_manifest({
				appid: appId,
			});
      const parsedResult = JSON.parse(result) as DownloadInfo;
      showSteamStylePopup(appId, parsedResult);
      console.log('Result from backendMethod:', parsedResult);
		} catch (error) {
			console.error('Backend call failed:', error);
			 showSteamStylePopup(
        appId,
        {
          success: false,
          available: false,
          message: 'Backend call failed',
        }
      );
		}
    document.body.style.cursor = 'default';
	});


  div.appendChild(button);
  button.appendChild(span);
  const firstChild = target.firstChild;
  if (firstChild) {
    target.insertBefore(div, firstChild);
  } else {
    target.appendChild(div);
  }
	return true;
}

function injectUpdateButton() {
  const target = document.querySelector('.queue_actions_ctn');
  console.log('injectUpdateButton called, target:', target);
  if (!target) {
    return false;
  }

  if (target.querySelector(`[${PLUGIN_BUTTON_UPDATE_ATTR}]`)) {
		return true;
	}

  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appid') ?? window.location.pathname.match(/\/app\/(\d+)/)?.[1];

  if (!appId) {
    return false;
  }
  currentAppId = appId;
  console.log(appId);
  
  const div = document.createElement('div');
  div.style.width = 'fix-content';
  div.style.display = 'flex';
  div.style.flexDirection = 'row';
  div.style.alignItems = "stretch";
  

	const button = document.createElement('a');
	button.setAttribute(PLUGIN_BUTTON_UPDATE_ATTR, 'true');
	button.href = 'javascript:void(0)';
	button.className = 'btn_green_steamui btn_medium';
	button.style.width = '100%';
  button.style.textAlign = 'center';

  const span = document.createElement('span');
  span.textContent = 'Update Manifest';
  

	button.addEventListener('click', async (event) => {
		event.preventDefault();
    try {
        const res = await update_manifest({
        appid: appId,
      });
      const parsedResult = JSON.parse(res) as UpdateInfo;
      showSteamStylePopup(appId, null, parsedResult);
    } catch (error) {
      console.error('Backend call failed:', error);
      showSteamStylePopup(
        appId,
        null,
        {
          success: false,
          updated: false,
          message: 'Backend call failed',
        }
      );
    }
    
	});


  div.appendChild(button);
  button.appendChild(span);
  const firstChild = target.firstChild;
  if (firstChild) {
    target.insertBefore(div, firstChild);
  } else {
    target.appendChild(div);
  }
	return true;
}


function isShopPage() {
  return document.querySelector('.queue_actions_ctn') !== null;
}

async function haveGameManifest(appId: string) {
  try {
    const exists = (await manifest_exists({ appid: appId })) === 'true' ? true : false;
    console.log(`Manifest exists for appId ${appId}:`, exists);
    return exists;
  } catch (error) {
    console.error('Error checking manifest existence:', error);
    return false;
  }
}

function getCurrentAppId() {
  const params = new URLSearchParams(window.location.search);
  const appId = params.get('appid') ?? window.location.pathname.match(/\/app\/(\d+)/)?.[1];
  if (!appId) {
    return "480";
  }
  return appId;
}

function getCurrentGameImgUrl(){
  return document.querySelector('.game_header_image_full')?.getAttribute('src');
}

export default async function WebkitMain() {
  
	const tryInject = () => {
    const currentAppId = getCurrentAppId();
    
		if (isShopPage()) {
      haveGameManifest(currentAppId).then((haveGame) => {
        if (haveGame) {
          injectUpdateButton();
        }else {
          injectShopButton();
        }
      });
    }
	};


	if (document.body) {
		const observer = new MutationObserver((): void => {
			tryInject();
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}
}


function showSteamStylePopup(appId: string, info: DownloadInfo | null = null, updateInfo: UpdateInfo | null = null) {
  const existingDialog = document.querySelector('dialog[data-millennium-popup="free-download"]') as HTMLDialogElement | null;
  if (existingDialog) {
    closePopup(existingDialog);
  }

  const dialog = document.createElement('dialog');
  dialog.dataset.millenniumPopup = 'free-download';
  dialog.className = '_32QRvPPBL733SpNR9x0Gp3';
  dialog.style.border = 'none';
  dialog.style.padding = '0';
  dialog.style.background = 'transparent';
  dialog.style.color = '#fff';
  dialog.style.width = 'min(860px, calc(100vw - 32px))';
  dialog.style.overflow = 'visible';
  dialog.style.borderRadius = '8px';

  const overlay = document.createElement('div');
  overlay.className = 'ModalOverlayContent active';
  overlay.style.background = 'rgba(0, 0, 0, 0.72)';
  overlay.style.backdropFilter = 'blur(6px)';
  overlay.style.padding = '24px';
  overlay.style.boxSizing = 'border-box';

  const modalPosition = document.createElement('div');
  modalPosition.className = 'ModalPosition';
  modalPosition.tabIndex = 0;
  modalPosition.style.outline = 'none';

  const content = document.createElement('div');
  content.className = 'ModalPosition_Content';
  content.style.background = 'linear-gradient(180deg, #1b2838 0%, #101822 100%)';
  content.style.border = '1px solid rgba(255, 255, 255, 0.08)';
  content.style.borderRadius = '8px';
  content.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.55)';
  content.style.overflow = 'hidden';

  const dismiss = buildCloseButton(() => closePopup(dialog));
  dismiss.style.position = 'absolute';
  dismiss.style.top = '14px';
  dismiss.style.right = '14px';

  const dialogContent = document.createElement('div');
  dialogContent.setAttribute('role', 'dialog');
  dialogContent.className = 'DialogContent _DialogLayout _28yxHQw3ZhIBbVa9EZ27Vo';
  dialogContent.style.padding = '0 24px 24px';

  const innerWidth = document.createElement('div');
  innerWidth.className = 'DialogContent_InnerWidth';
  innerWidth.style.display = 'grid';
  innerWidth.style.gap = '16px';
  innerWidth.style.paddingTop = '18px';

  const title = document.createElement('div');
  title.className = 'bCGAC51za6R_thjPd7_vw';
  if (info) {
    title.textContent = info.available ? 'Added to your library' : 'Not available for free download';
  } else if (updateInfo) {
    title.textContent = updateInfo.updated ? 'Manifest updated successfully' : 'Failed to update manifest';
  }
  title.style.fontSize = '28px';
  title.style.fontWeight = '700';
  title.style.lineHeight = '1.1';

  const summary = document.createElement('div');
  summary.className = 'Panel Focusable';
  summary.style.display = 'grid';
  summary.style.gap = '14px';
  summary.style.padding = '14px';
  summary.style.borderRadius = '8px';
  summary.style.background = 'rgba(255, 255, 255, 0.04)';
  summary.style.border = '1px solid rgba(255, 255, 255, 0.06)';

  const row = document.createElement('div');
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '160px 1fr';
  row.style.gap = '16px';
  row.style.alignItems = 'start';

  const coverLink = document.createElement('a');
  coverLink.href = `https://store.steampowered.com/app/${appId}/`;
  coverLink.target = '_blank';
  coverLink.rel = 'noreferrer';

  const cover = document.createElement('img');
  cover.alt = `App ${appId}`;
  cover.src = getCurrentGameImgUrl() || `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/header.jpg`;
  cover.style.display = 'block';
  cover.style.width = '160px';
  cover.style.height = '75px';
  cover.style.objectFit = 'cover';
  cover.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';

  const textBlock = document.createElement('div');
  textBlock.style.display = 'grid';
  textBlock.style.gap = '10px';

  const message = document.createElement('div');
  if (info) {
    message.textContent = info.message;
  } else if (updateInfo) {
    message.textContent = updateInfo.message;
  }
  message.style.fontSize = '15px';
  message.style.lineHeight = '1.45';
  message.style.color = 'rgba(255, 255, 255, 0.88)';

  const status = document.createElement('div');
  if (info) {
    status.textContent = info.available ? 'Available' : 'Unavailable';
  } else if (updateInfo) {
    status.textContent = updateInfo.updated ? 'Updated' : 'Not Updated';
  }
  status.style.display = 'inline-flex';
  status.style.width = 'fit-content';
  status.style.padding = '5px 10px';
  status.style.borderRadius = '999px';
  status.style.fontSize = '12px';
  status.style.fontWeight = '700';
  status.style.letterSpacing = '0.02em';
  if (info) {
    status.style.background = info.available ? 'rgba(102, 192, 244, 0.16)' : 'rgba(221, 128, 128, 0.16)';
    status.style.color = info.available ? '#bce3ff' : '#ffd0d0';
  } else if (updateInfo) {
    status.style.background = updateInfo.updated ? 'rgba(102, 192, 244, 0.16)' : 'rgba(221, 128, 128, 0.16)';
    status.style.color = updateInfo.updated ? '#bce3ff' : '#ffd0d0';
  }

  const actions = document.createElement('div');
  actions.className = '_1qRagOpQN0EH1x4-13UjR5 Panel Focusable';
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '12px';
  actions.style.paddingTop = '4px';

  const primaryButton = document.createElement('button');
  primaryButton.type = 'button';
  primaryButton.className = 'DialogButton _DialogLayout Primary Focusable';
  primaryButton.textContent = 'Fermer';
  primaryButton.style.cursor = 'pointer';
  primaryButton.addEventListener('click', () => closePopup(dialog));

  actions.appendChild(primaryButton);
  textBlock.appendChild(status);
  textBlock.appendChild(message);
  coverLink.appendChild(cover);
  row.appendChild(coverLink);
  row.appendChild(textBlock);
  summary.appendChild(row);
  innerWidth.appendChild(title);
  innerWidth.appendChild(summary);
  innerWidth.appendChild(actions);
  dialogContent.appendChild(innerWidth);
  content.appendChild(dismiss);
  content.appendChild(dialogContent);
  modalPosition.appendChild(content);
  overlay.appendChild(modalPosition);
  dialog.appendChild(overlay);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closePopup(dialog);
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePopup(dialog);
  });

  document.body.appendChild(dialog);

  try {
    dialog.showModal();
  } catch {
    dialog.setAttribute('open', '');
  }

  return dialog;
}

function closePopup(dialog: HTMLDialogElement) {
  if (dialog.open) {
    dialog.close();
  }
  dialog.remove();
}

function buildCloseButton(onClick: () => void) {
  const closeWrapper = document.createElement('div');
  closeWrapper.className = 'ModalPosition_Dismiss';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'closeButton';
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.style.border = 'none';
  closeButton.style.background = 'transparent';
  closeButton.style.cursor = 'pointer';
  closeButton.style.padding = '0';
  closeButton.style.display = 'grid';
  closeButton.style.placeItems = 'center';
  closeButton.style.width = '14px';
  closeButton.style.height = '14px';

  closeButton.innerHTML = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" class="SVGIcon_Button SVGIcon_X_Line" width="18" height="18" viewBox="0 0 256 256" aria-hidden="true">
      <line fill="none" stroke="#FFFFFF" stroke-width="45" stroke-miterlimit="10" x1="212" y1="212" x2="44" y2="44"></line>
      <line fill="none" stroke="#FFFFFF" stroke-width="45" stroke-miterlimit="10" x1="44" y1="212" x2="212" y2="44"></line>
    </svg>
  `;

  closeButton.addEventListener('click', onClick);
  closeWrapper.appendChild(closeButton);
  return closeWrapper;
}
