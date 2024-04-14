/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import {bills} from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import Dashboard from "../containers/Dashboard.js";
import DashboardUI from "../views/DashboardUI.js";
import userEvent from "@testing-library/user-event";

jest.mock("../app/store", () => mockStore)
describe("Given I am connected as an employee", () => {
    beforeEach(() => {
        Object.defineProperty(window, "localStorage", {value: localStorageMock});
        window.localStorage.setItem("user", JSON.stringify({type: "Employee", email: "employee@test.tld"}));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
    })
    afterEach(() => {
        // Nettoyer les modifications apportées pendant les tests
        window.localStorage.removeItem("user");
        document.body.innerHTML = "";
    });
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => screen.getByTestId('icon-window'))
            const windowIcon = screen.getByTestId('icon-window')
            expect(windowIcon.classList.contains('active-icon')).toBe(true);
        })
        test("Then it should redirect to the NewBill page on click of 'Nouvelle note de frais'", () => {
            const html = BillsUI({data: bills});
            document.body.innerHTML = html;
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({pathname});
            };
            const bill = new Bills({
                document,
                onNavigate,
                localStorage: window.localStorage,
                store: null,
            });
            const btnNewBill = screen.getByTestId("btn-new-bill");
            const mockFunctionHandleClick = jest.fn(bill.handleClickNewBill);
            btnNewBill.addEventListener("click", mockFunctionHandleClick);
            userEvent.click(btnNewBill);
            expect(mockFunctionHandleClick).toHaveBeenCalled();
        })
        test("Then it should display the invoice modal when you click on the bill view button", () => {
            window.onNavigate(ROUTES_PATH.Bills)
            document.body.innerHTML = BillsUI({data: bills})
            const currentBills = new Bills({
                document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
            })
            const handleClickIconEye = jest.fn(currentBills.handleClickIconEye)
            currentBills.handleClickIconEye = handleClickIconEye;
            const modal = screen.getByTestId('modal-img');
            $.fn.modal = jest.fn(() => {
                modal.classList.add('show')
            });
            const icons = screen.getAllByTestId('icon-eye');
            icons.forEach(icon => {
                userEvent.click(icon)
                expect(handleClickIconEye).toHaveBeenCalled()
                const styles = getComputedStyle(modal);
                expect(styles.display).toBe('block');
                expect(modal.classList.contains('show')).toBeTruthy();
            })
        })
        test("Then bills should be ordered from earliest to latest", async () => {
            const billsPage = new Bills({document, onNavigate, store: mockStore, localStorage: localStorage});
            const allBills = await billsPage.getBills();
            const dates = allBills.map((bill) => bill.date);
            const antiChrono = (a, b) => ((a < b) ? 1 : -1)
            const datesSorted = [...dates].sort(antiChrono)
            expect(dates).toEqual(datesSorted)
        })
        describe("When an error occurs on API", () => {
            beforeEach(() => {
                jest.spyOn(mockStore, "bills")
            })
            test("fetches bills from an API and fails with 404 message error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 404"))
                        }
                    }
                })
                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 404/)
                expect(message).toBeTruthy()
            })
            test("fetches messages from an API and fails with 500 message error", async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error("Erreur 500"))
                        }
                    }
                })
                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick);
                const message = await screen.getByText(/Erreur 500/)
                expect(message).toBeTruthy()
            })
        })
    })
})
